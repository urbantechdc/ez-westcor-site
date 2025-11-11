#!/usr/bin/env python3
"""
Organize ADP downloads into structured folders.

Usage:
    uv run organize_downloads.py [--source downloads] [--target organized] [--dry-run]
"""

import argparse
import os
import re
import shutil
import zipfile
from pathlib import Path
from collections import defaultdict
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('organize_downloads.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def sanitize_folder_name(name):
    """
    Sanitize a name for use as a folder name by removing/replacing invalid characters.
    """
    # Replace invalid characters with safe alternatives
    invalid_chars = r'[<>:"/\\|?*]'
    sanitized = re.sub(invalid_chars, '_', name)

    # Remove leading/trailing whitespace and dots
    sanitized = sanitized.strip('. ')

    # Ensure it's not too long (Windows has 255 char limit)
    if len(sanitized) > 200:
        sanitized = sanitized[:200]

    return sanitized


def parse_filename(filename):
    """
    Parse different filename formats and extract user info.

    Returns dict with:
        - user_num: User number (int)
        - employee_id: Employee ID
        - name: Employee name
        - file_type: 'empty', 'pdf', or 'zip'
        - original: Original filename
    """
    # Remove file extension
    name_no_ext = filename.rsplit('.', 1)[0]
    file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

    # Pattern 1: EMPTY files - "EMPTY - AXV013545 - 4792 - Jose Urista Flores.txt"
    pattern1 = re.compile(r'^EMPTY - ([A-Z0-9]+) - (\d+) - (.+)$')
    match = pattern1.match(name_no_ext)
    if match and file_ext == 'txt':
        employee_id, user_num, name = match.groups()
        return {
            'user_num': int(user_num),
            'employee_id': employee_id,
            'name': name,
            'file_type': 'empty',
            'original': filename
        }

    # Pattern 2: PDF files - "FILE - AXV018298 - 1201 - Johny Dominguez.pdf"
    pattern2 = re.compile(r'^FILE - ([A-Z0-9]+) - (\d+) - (.+)$')
    match = pattern2.match(name_no_ext)
    if match and file_ext == 'pdf':
        employee_id, user_num, name = match.groups()
        return {
            'user_num': int(user_num),
            'employee_id': employee_id,
            'name': name,
            'file_type': 'pdf',
            'original': filename
        }

    # Pattern 3: ZIP files with user number - "AL5015800 - 1205 - Alejandro Dominguez-Maqueda.zip"
    pattern3 = re.compile(r'^([A-Z0-9]+) - (\d+) - (.+)$')
    match = pattern3.match(name_no_ext)
    if match and file_ext == 'zip':
        employee_id, user_num, name = match.groups()
        return {
            'user_num': int(user_num),
            'employee_id': employee_id,
            'name': name,
            'file_type': 'zip',
            'original': filename
        }

    # Pattern 4: Old ZIP format without user number - "AXV010046 - Francisco Aguirre.zip"
    pattern4 = re.compile(r'^([A-Z0-9]+) - (.+)$')
    match = pattern4.match(name_no_ext)
    if match and file_ext == 'zip':
        employee_id, name = match.groups()
        # We can't determine user number from filename, return None
        return {
            'user_num': None,
            'employee_id': employee_id,
            'name': name,
            'file_type': 'zip',
            'original': filename
        }

    # If no pattern matches, return None
    logger.warning(f"Could not parse filename: {filename}")
    return None


def count_document_files(folder_path):
    """
    Count actual document files in a folder, excluding system files and the original zip.
    """
    folder = Path(folder_path)
    if not folder.exists():
        return 0

    # System files to ignore
    system_files = {'.DS_Store', 'Thumbs.db', 'desktop.ini', '__MACOSX'}

    count = 0
    for item in folder.iterdir():
        if item.is_file():
            # Skip system files
            if item.name in system_files:
                continue
            # Skip the original zip file
            if item.name.endswith('.zip'):
                continue
            # Skip hidden files (starting with .)
            if item.name.startswith('.'):
                continue

            count += 1

    return count


def extract_zip_safely(zip_path, extract_to):
    """
    Safely extract a ZIP file, handling various edge cases.
    Returns the number of extracted files.
    """
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for suspicious file paths
            for member in zip_ref.namelist():
                if member.startswith('/') or '..' in member:
                    logger.warning(f"Suspicious path in ZIP {zip_path}: {member}")
                    continue

            # Extract all files
            zip_ref.extractall(extract_to)
            logger.info(f"Extracted ZIP: {zip_path}")

            # Return count of extracted files (excluding directories)
            extracted_count = 0
            for member in zip_ref.namelist():
                if not member.endswith('/'):  # Not a directory
                    extracted_count += 1

            return extracted_count

    except zipfile.BadZipFile:
        logger.error(f"Corrupted ZIP file: {zip_path}")
        return 0
    except Exception as e:
        logger.error(f"Error extracting ZIP {zip_path}: {e}")
        return 0


def create_organized_folder(file_info, source_path, target_base, dry_run=False):
    """
    Create organized folder and copy/process the file.
    Returns (success, folder_name, file_count).
    """
    user_num = file_info['user_num']
    employee_id = file_info['employee_id']
    name = sanitize_folder_name(file_info['name'])
    file_type = file_info['file_type']
    original_filename = file_info['original']

    # Determine file count based on type
    if file_type == 'empty':
        file_count = 0
    elif file_type == 'pdf':
        file_count = 1
    else:  # zip - we'll determine this after extraction
        file_count = 99  # Placeholder, will be updated after extraction

    # Create folder name with zero-padding
    if user_num is not None:
        folder_name = f"{user_num:04d} - {employee_id} - {name} - {file_count:02d}"
    else:
        # For old format files without user numbers
        folder_name = f"XXXX - {employee_id} - {name} - {file_count:02d}"

    target_folder = Path(target_base) / folder_name

    if dry_run:
        logger.info(f"[DRY RUN] Would create: {target_folder}")
        return True, folder_name, file_count

    try:
        # Create target folder
        target_folder.mkdir(parents=True, exist_ok=True)

        source_file = Path(source_path) / original_filename

        if file_type == 'empty':
            # Copy EMPTY txt file
            shutil.copy2(source_file, target_folder)
            logger.info(f"Copied EMPTY file: {original_filename} -> {target_folder}")

        elif file_type == 'pdf':
            # Copy PDF file
            shutil.copy2(source_file, target_folder)
            logger.info(f"Copied PDF file: {original_filename} -> {target_folder}")

        elif file_type == 'zip':
            # Copy ZIP file first
            zip_in_folder = target_folder / original_filename
            shutil.copy2(source_file, zip_in_folder)

            # Extract ZIP contents
            extracted_count = extract_zip_safely(zip_in_folder, target_folder)

            # Count actual document files (excluding the zip itself)
            actual_file_count = count_document_files(target_folder)

            # Rename folder with correct file count
            if actual_file_count != file_count:
                if user_num is not None:
                    new_folder_name = f"{user_num:04d} - {employee_id} - {name} - {actual_file_count:02d}"
                else:
                    new_folder_name = f"XXXX - {employee_id} - {name} - {actual_file_count:02d}"

                new_target_folder = Path(target_base) / new_folder_name

                # Rename the folder
                target_folder.rename(new_target_folder)
                target_folder = new_target_folder
                file_count = actual_file_count

                logger.info(f"Renamed folder to reflect actual file count: {new_folder_name}")

            logger.info(f"Processed ZIP file: {original_filename} -> {target_folder} ({file_count} files)")

        return True, target_folder.name, file_count

    except Exception as e:
        logger.error(f"Error processing {original_filename}: {e}")
        return False, folder_name, file_count


def main():
    parser = argparse.ArgumentParser(description='Organize ADP downloads into structured folders')
    parser.add_argument('--source', default='downloads', help='Source directory (default: downloads)')
    parser.add_argument('--target', default='organized', help='Target directory (default: organized)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without actually doing it')

    args = parser.parse_args()

    source_dir = Path(args.source)
    target_dir = Path(args.target)

    if not source_dir.exists():
        logger.error(f"Source directory does not exist: {source_dir}")
        return 1

    # Get all files in source directory
    files = [f for f in source_dir.iterdir() if f.is_file()]

    if not files:
        logger.info("No files found in source directory")
        return 0

    logger.info(f"Found {len(files)} files to process")

    if not args.dry_run:
        target_dir.mkdir(parents=True, exist_ok=True)

    # Process each file
    success_count = 0
    error_count = 0
    stats = defaultdict(int)

    for file_path in files:
        filename = file_path.name

        # Skip hidden files
        if filename.startswith('.'):
            continue

        logger.info(f"Processing: {filename}")

        # Parse filename
        file_info = parse_filename(filename)
        if not file_info:
            logger.warning(f"Skipping unparseable file: {filename}")
            error_count += 1
            continue

        # Create organized folder
        success, folder_name, file_count = create_organized_folder(
            file_info, source_dir, target_dir, args.dry_run
        )

        if success:
            success_count += 1
            stats[file_info['file_type']] += 1
            stats[f"{file_info['file_type']}_files"] += file_count
        else:
            error_count += 1

    # Print summary
    logger.info(f"\n{'='*60}")
    logger.info("ORGANIZATION SUMMARY")
    logger.info(f"{'='*60}")
    logger.info(f"Total files processed: {success_count + error_count}")
    logger.info(f"Successfully organized: {success_count}")
    logger.info(f"Errors: {error_count}")
    logger.info(f"")
    logger.info(f"File type breakdown:")
    logger.info(f"  EMPTY records: {stats['empty']} (0 total files)")
    logger.info(f"  PDF files: {stats['pdf']} ({stats['pdf_files']} total files)")
    logger.info(f"  ZIP archives: {stats['zip']} ({stats['zip_files']} total files)")
    logger.info(f"")
    if args.dry_run:
        logger.info("This was a DRY RUN - no files were actually moved or copied")
    else:
        logger.info(f"Organized files are in: {target_dir}")

    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    exit(main())