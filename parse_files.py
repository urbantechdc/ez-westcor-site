#!/usr/bin/env python3
"""
EZ-Westcor files.txt Parser
Parses employee file listings and populates the D1 database.

File format:
- Employee header: 0006 - AL5017130 - Jonathan A Abrego-Miranda - 04
- File entry: 0006 - AL5017130 - Jonathan A Abrego-Miranda - 04/DETR Jonathan A Abrego-Miranda 01.12.2021.pdf
- Empty employee: 0001 - AXV017147 - Carlos F Abdala-Cobos - 00
- Empty placeholder: 0001 - AXV017147 - Carlos F Abdala-Cobos - 00/EMPTY - AXV017147 - 1 - Carlos F Abdala-Cobos.txt
"""

import re
import sqlite3
import os
from datetime import datetime
from collections import defaultdict

def parse_files_txt(file_path):
    """Parse files.txt and extract employee and file information."""

    employees = {}
    employee_files = []

    print(f"📄 Parsing {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f"📊 Total lines to process: {len(lines)}")

    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue

        # Match the format: [Employee#] - [Employee ID] - [Employee Name] - [File Count][/File Name]
        match = re.match(r'^(\d+) - ([A-Z0-9]+) - (.+?) - (\d+)(?:/(.+))?$', line)

        if not match:
            print(f"⚠️  Line {line_num}: Could not parse: {line[:100]}...")
            continue

        emp_number, emp_id, emp_name, file_count, file_name = match.groups()
        file_count = int(file_count)

        # Store employee info
        if emp_id not in employees:
            # Split name into first and last name (simple approach)
            name_parts = emp_name.strip().split()
            if len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = ' '.join(name_parts[1:])
            else:
                first_name = emp_name
                last_name = ''

            employees[emp_id] = {
                'employee_number': int(emp_number),
                'employee_id': emp_id,
                'full_name': emp_name,
                'first_name': first_name,
                'last_name': last_name,
                'file_count': file_count,
                'status': 'active'
            }

        # If there's a file name, it's a file entry
        if file_name:
            is_empty = file_name.startswith('EMPTY -')

            # Determine file type
            file_type = ''
            if '.' in file_name:
                file_type = '.' + file_name.split('.')[-1].lower()

            # Determine category (00 for empty, 04 for files with content)
            category_code = '00' if is_empty else '04'

            employee_files.append({
                'index_number': emp_number.zfill(4),
                'employee_id': emp_id,
                'file_name': file_name,
                'file_path': f"{file_count:02d}/{file_name}",
                'category_code': category_code,
                'file_type': file_type,
                'is_empty': is_empty
            })

    print(f"✅ Parsed {len(employees)} employees and {len(employee_files)} files")
    return employees, employee_files

def connect_to_database():
    """Connect to the local D1 database."""
    db_path = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/2b35d4d42e3c9f6b5ad5b5579a7b1470c66e69f6b33a31e3f5a0095cc6d18656.sqlite'

    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        print("   Make sure you've run: ./build.sh --migrate-local")
        return None

    print(f"🔌 Connecting to database: {db_path}")
    return sqlite3.connect(db_path)

def populate_database(employees, employee_files):
    """Populate the D1 database with parsed data."""

    conn = connect_to_database()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        print("🧹 Clearing existing data...")
        cursor.execute("DELETE FROM employee_files")
        cursor.execute("DELETE FROM employees")

        print("👥 Inserting employees...")
        for emp_id, emp_data in employees.items():
            cursor.execute("""
                INSERT INTO employees (id, employee_id, full_name, first_name, last_name, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                f"emp_{emp_data['employee_number']:04d}",
                emp_data['employee_id'],
                emp_data['full_name'],
                emp_data['first_name'],
                emp_data['last_name'],
                emp_data['status']
            ))

        print("📁 Inserting employee files...")
        for file_data in employee_files:
            cursor.execute("""
                INSERT INTO employee_files
                (index_number, employee_id, file_name, file_path, category_code, file_type, is_empty)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                file_data['index_number'],
                file_data['employee_id'],
                file_data['file_name'],
                file_data['file_path'],
                file_data['category_code'],
                file_data['file_type'],
                file_data['is_empty']
            ))

        # Update system config
        print("⚙️  Updating system configuration...")
        cursor.execute("""
            UPDATE system_config
            SET value = ?
            WHERE key = 'last_import'
        """, (datetime.now().isoformat(),))

        conn.commit()
        print("✅ Database populated successfully!")

        # Show summary
        cursor.execute("SELECT COUNT(*) FROM employees")
        emp_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM employee_files")
        file_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM employee_files WHERE is_empty = 0")
        content_files = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM employee_files WHERE is_empty = 1")
        empty_files = cursor.fetchone()[0]

        print(f"\n📊 Database Summary:")
        print(f"   👥 Employees: {emp_count}")
        print(f"   📁 Total Files: {file_count}")
        print(f"   📄 Content Files: {content_files}")
        print(f"   📋 Empty Files: {empty_files}")

        return True

    except Exception as e:
        print(f"❌ Error populating database: {e}")
        return False
    finally:
        conn.close()

def main():
    """Main function to parse files.txt and populate database."""
    print("🚀 EZ-Westcor File Parser Starting...")
    print("=" * 50)

    files_txt_path = 'files.txt'

    if not os.path.exists(files_txt_path):
        print(f"❌ {files_txt_path} not found in current directory")
        return

    # Parse the files.txt
    employees, employee_files = parse_files_txt(files_txt_path)

    if not employees:
        print("❌ No employee data parsed. Check file format.")
        return

    # Populate database
    if populate_database(employees, employee_files):
        print("\n🎉 Success! Your database is now populated with real employee file data.")
        print("   Restart your development server to see the changes.")
    else:
        print("\n❌ Failed to populate database.")

if __name__ == "__main__":
    main()