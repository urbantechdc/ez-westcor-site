<script>
	import { onMount } from 'svelte';

	let downloadCode = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let downloadLogs = [];

	// Admin modal state
	let showAdminModal = false;
	let isUploading = false;
	let uploadError = '';
	let uploadSuccess = '';
	let selectedFile = null;
	let selectedRecipient = '';
	let codeDescription = '';
	let fileSelectionMode = 'upload'; // 'upload' or 'existing'
	let existingFiles = [];
	let selectedExistingFile = '';
	let isLoadingFiles = false;

	// Predefined users
	const predefinedUsers = [
		{ email: 'matt@easyharvest.ai', name: 'Matt Webster' },
		{ email: 'matt@urbantechdc.com', name: 'Matt (Urban Tech)' },
		{ email: 'JHafen@westcorconstruction.com', name: 'Jordan Hafen' },
		{ email: 'andrew.lindsey@easyharvest.ai', name: 'Andrew Lindsey' }
	];

	// Check if user is admin
	let isAdmin = false;

	// Handle download code submission
	async function handleDownload() {
		if (!downloadCode.trim()) {
			errorMessage = 'Please enter a download code';
			return;
		}

		console.log('🚀 Starting download process for code:', downloadCode.trim());

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			console.log('📡 Making validation request...');

			// First validate the code
			const response = await fetch('/api/downloads/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ code: downloadCode.trim() })
			});

			console.log('📨 Validation response status:', response.status);
			console.log('📨 Validation response headers:', [...response.headers.entries()]);

			if (response.ok) {
				console.log('✅ Validation response OK, parsing JSON...');
				const result = await response.json();
				console.log('📋 Validation result:', result);

				if (result.success && result.download) {
					console.log('🎯 Code is valid, preparing download...');

					// Code is valid, now get presigned URL for direct download
					const fileName = result.download.file_name;
					const presignedEndpoint = result.download.download_url;
					const fileSize = result.download.file_size;
					const downloadType = result.download.download_type;

					console.log('📁 File info:', { fileName, presignedEndpoint, fileSize, downloadType });

					try {
						if (downloadType === 'presigned') {
							console.log('🔗 Getting presigned URL for direct R2 download...');

							// Get presigned URL from our endpoint
							const presignedResponse = await fetch(presignedEndpoint, {
								credentials: 'include'
							});

							console.log('🔗 Presigned response status:', presignedResponse.status);

							if (presignedResponse.ok) {
								const presignedData = await presignedResponse.json();
								console.log('✅ Presigned URL generated:', presignedData.presignedUrl);

								// Direct download using presigned URL (no memory usage)
								console.log('🚀 Starting direct R2 download...');
								window.open(presignedData.presignedUrl, '_blank');

								console.log('🎉 Download initiated successfully!');
								successMessage = `Download started for ${fileName} (${formatFileSize(fileSize)}) - Check your downloads folder`;
								downloadCode = '';
							} else {
								console.error('❌ Presigned URL generation failed:', presignedResponse.status);
								const errorText = await presignedResponse.text();
								console.error('❌ Presigned error response:', errorText);
								errorMessage = 'Failed to generate download link. Please try again.';
							}
						} else {
							// Fallback to old streaming method for smaller files
							console.log('⬇️ Using streaming download (fallback)...');

							const downloadResponse = await fetch(presignedEndpoint, {
								credentials: 'include'
							});

							if (downloadResponse.ok) {
								const blob = await downloadResponse.blob();

								// Create download link
								const url = window.URL.createObjectURL(blob);
								const link = document.createElement('a');
								link.href = url;
								link.download = fileName;
								document.body.appendChild(link);
								link.click();
								document.body.removeChild(link);
								window.URL.revokeObjectURL(url);

								successMessage = `Successfully downloaded ${fileName} (${formatFileSize(fileSize)})`;
								downloadCode = '';
							} else {
								errorMessage = 'Failed to download file. Please try again.';
							}
						}
					} catch (downloadError) {
						console.error('💥 Download error:', downloadError);
						errorMessage = 'Error downloading file. Please try again.';
					}
				} else {
					console.error('❌ Validation failed:', result);
					errorMessage = result.message || 'Invalid download code';
				}
			} else {
				console.error('❌ Validation request failed with status:', response.status);
				try {
					const errorData = await response.json();
					console.error('❌ Validation error response:', errorData);
					errorMessage = errorData.message || 'Download validation failed';
				} catch (parseError) {
					console.error('💥 Failed to parse error response:', parseError);
					const errorText = await response.text();
					console.error('❌ Raw error response:', errorText);
					errorMessage = 'Download validation failed';
				}
			}
		} catch (error) {
			console.error('💥 Network/Fetch error:', error);
			errorMessage = 'Network error. Please try again.';
		} finally {
			console.log('🏁 Download process finished, cleaning up...');
			isLoading = false;
			// Refresh logs after any download attempt
			await loadDownloadLogs();
			console.log('📊 Logs refreshed');
		}
	}

	// Helper function to format file size
	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Helper function to format timestamp in Eastern timezone
	function formatTimestamp(timestamp) {
		if (!timestamp) return 'Unknown';
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			timeZone: 'America/New_York',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true
		});
	}

	// Load download logs
	async function loadDownloadLogs() {
		try {
			const response = await fetch('/api/downloads/logs', {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				downloadLogs = data.logs || [];
			}
		} catch (error) {
			console.error('Error loading download logs:', error);
		}
	}

	// Check if current user is admin
	async function checkAdminStatus() {
		try {
			const response = await fetch('/api/auth/user', {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				isAdmin = data.email === 'matt@easyharvest.ai';
			}
		} catch (error) {
			console.error('Error checking admin status:', error);
			isAdmin = false;
		}
	}

	// Load existing R2 files
	async function loadExistingFiles() {
		if (fileSelectionMode !== 'existing' || existingFiles.length > 0) return;

		isLoadingFiles = true;
		try {
			const response = await fetch('/api/downloads/admin/files', {
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				existingFiles = data.files || [];
			} else {
				uploadError = 'Failed to load existing files';
			}
		} catch (error) {
			uploadError = 'Error loading files';
			console.error('Error loading files:', error);
		} finally {
			isLoadingFiles = false;
		}
	}

	// Handle file upload and code generation
	async function handleAdminUpload() {
		if (!selectedRecipient.trim()) {
			uploadError = 'Please select a recipient';
			return;
		}

		if (fileSelectionMode === 'upload' && !selectedFile) {
			uploadError = 'Please select a file to upload';
			return;
		}

		if (fileSelectionMode === 'existing' && !selectedExistingFile) {
			uploadError = 'Please select an existing file';
			return;
		}

		isUploading = true;
		uploadError = '';
		uploadSuccess = '';

		try {
			if (fileSelectionMode === 'upload') {
				// Check file size to determine upload method
				const fileSizeMB = selectedFile.size / (1024 * 1024);
				const LARGE_FILE_THRESHOLD = 50; // MB

				if (fileSizeMB > LARGE_FILE_THRESHOLD) {
					// Use presigned URL for large files
					uploadSuccess = `⚡ Large file detected (${fileSizeMB.toFixed(1)}MB). Using presigned S3 upload...`;

					// Step 1: Generate presigned upload URL
					const presignedResponse = await fetch('/api/uploads/presigned-url', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						credentials: 'include',
						body: JSON.stringify({
							fileName: selectedFile.name,
							contentType: selectedFile.type || 'application/octet-stream',
							fileSize: selectedFile.size.toString()
						})
					});

					if (!presignedResponse.ok) {
						const errorData = await presignedResponse.json();
						throw new Error(errorData.message || 'Failed to generate presigned URL');
					}

					const presignedData = await presignedResponse.json();

					// Step 2: Upload directly to R2 using presigned URL
					uploadSuccess = `🚀 Uploading ${fileSizeMB.toFixed(1)}MB file directly to R2...`;

					const uploadResponse = await fetch(presignedData.presignedUrl, {
						method: 'PUT',
						headers: {
							'Content-Type': selectedFile.type || 'application/octet-stream',
							'Content-Length': selectedFile.size.toString()
						},
						body: selectedFile
					});

					if (!uploadResponse.ok) {
						const errorText = await uploadResponse.text();
						throw new Error(`Presigned upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
					}

					// Step 3: Generate download code for uploaded file
					uploadSuccess = `✅ Upload complete! Generating download code...`;

					const codeResponse = await fetch('/api/downloads/admin/generate-code', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						credentials: 'include',
						body: JSON.stringify({
							fileKey: presignedData.fileKey,
							recipientEmail: selectedRecipient.trim(),
							description: codeDescription.trim()
						})
					});

					if (codeResponse.ok) {
						const result = await codeResponse.json();
						uploadSuccess = `🎉 Large file uploaded successfully! Download code: ${result.code}`;
					} else {
						const errorData = await codeResponse.json();
						throw new Error(errorData.message || 'Code generation failed');
					}
				} else {
					// Use traditional upload for smaller files
					const formData = new FormData();
					formData.append('file', selectedFile);
					formData.append('recipientEmail', selectedRecipient.trim());
					formData.append('description', codeDescription.trim());

					const response = await fetch('/api/downloads/admin/upload', {
						method: 'POST',
						credentials: 'include',
						body: formData
					});

					if (response.ok) {
						const result = await response.json();
						uploadSuccess = `Download code generated: ${result.code}`;
					} else {
						const errorData = await response.json();
						uploadError = errorData.message || 'Upload failed';
					}
				}
			} else {
				// Use existing file
				const response = await fetch('/api/downloads/admin/generate-code', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						fileKey: selectedExistingFile,
						recipientEmail: selectedRecipient.trim(),
						description: codeDescription.trim()
					})
				});

				if (response.ok) {
					const result = await response.json();
					uploadSuccess = `Download code generated: ${result.code}`;
				} else {
					const errorData = await response.json();
					uploadError = errorData.message || 'Code generation failed';
				}
			}

			// Clear form on success
			if (!uploadError) {
				selectedFile = null;
				selectedRecipient = '';
				codeDescription = '';
				selectedExistingFile = '';
				if (document.getElementById('fileInput')) {
					document.getElementById('fileInput').value = '';
				}
				// Refresh logs
				await loadDownloadLogs();
			}
		} catch (error) {
			uploadError = 'Network error. Please try again.';
			console.error('Upload error:', error);
		} finally {
			isUploading = false;
		}
	}

	// Delete a log entry
	async function deleteLog(logId) {
		if (!confirm('Are you sure you want to delete this log entry?')) {
			return;
		}

		try {
			const response = await fetch(`/api/downloads/admin/delete-log/${logId}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			if (response.ok) {
				// Refresh logs
				await loadDownloadLogs();
			} else {
				alert('Failed to delete log entry');
			}
		} catch (error) {
			alert('Error deleting log entry');
			console.error('Delete error:', error);
		}
	}

	// Handle file selection
	function handleFileSelect(event) {
		selectedFile = event.target.files[0];
		uploadError = '';
		uploadSuccess = '';
	}

	// Load logs on page mount
	onMount(() => {
		loadDownloadLogs();
		checkAdminStatus();
	});

	// Handle Enter key in input
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleDownload();
		}
	}
</script>

<svelte:head>
	<title>Downloads - EZ-Westcor File Search</title>
</svelte:head>

<div class="container-fluid py-4">
	<div class="row">
		<div class="col-12">
			<div class="d-flex align-items-center justify-content-between mb-4">
				<div>
					<h2 class="h3 mb-0 text-usaf-blue fw-bold">Secure Downloads</h2>
					<p class="text-muted mb-0">Access files using one-time download codes</p>
				</div>
				{#if isAdmin}
					<button
						type="button"
						class="btn btn-outline-primary"
						on:click={() => showAdminModal = true}
					>
						<i class="me-2">⚙️</i>
						Generate Code
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="row">
		<!-- Download Form -->
		<div class="col-lg-6">
			<div class="card shadow-sm h-100">
				<div class="card-header bg-usaf-blue text-white">
					<h5 class="card-title mb-0">
						<i class="me-2">🔐</i>
						Enter Download Code
					</h5>
				</div>
				<div class="card-body">
					<p class="text-muted mb-4">
						Enter your one-time download code below. Each code can only be used once and will expire after use.
					</p>

					<div class="mb-3">
						<label for="downloadCode" class="form-label fw-semibold">Download Code</label>
						<div class="input-group">
							<input
								type="text"
								class="form-control form-control-lg"
								id="downloadCode"
								bind:value={downloadCode}
								on:keypress={handleKeyPress}
								placeholder="Enter your download code..."
								disabled={isLoading}
								autocomplete="off"
							/>
							<button
								class="btn btn-primary btn-lg"
								type="button"
								on:click={handleDownload}
								disabled={isLoading || !downloadCode.trim()}
							>
								{#if isLoading}
									<span class="spinner-border spinner-border-sm me-2" role="status"></span>
									Validating...
								{:else}
									Download
								{/if}
							</button>
						</div>
					</div>

					{#if errorMessage}
						<div class="alert alert-danger" role="alert">
							<strong>Error:</strong> {errorMessage}
						</div>
					{/if}

					{#if successMessage}
						<div class="alert alert-success" role="alert">
							<strong>Success:</strong> {successMessage}
						</div>
					{/if}

					<div class="alert alert-info" role="alert">
						<h6 class="alert-heading mb-2">
							<i class="me-1">ℹ️</i>
							Important Notes
						</h6>
						<ul class="mb-0 small">
							<li>Download codes are single-use only</li>
							<li>Codes expire after being used once</li>
							<li>Files are securely accessed from our protected storage</li>
							<li>All download attempts are logged for security</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Download Logs -->
		<div class="col-lg-6">
			<div class="card shadow-sm h-100">
				<div class="card-header d-flex justify-content-between align-items-center">
					<h5 class="card-title mb-0">
						<i class="me-2">📊</i>
						Download Activity Log
					</h5>
					<button
						class="btn btn-outline-secondary btn-sm"
						type="button"
						on:click={loadDownloadLogs}
					>
						Refresh
					</button>
				</div>
				<div class="card-body p-0">
					{#if downloadLogs.length === 0}
						<div class="text-center py-5 text-muted">
							<div class="mb-3">
								<i style="font-size: 3rem;">📭</i>
							</div>
							<p class="mb-0">No download activity yet</p>
							<small>Download attempts will appear here</small>
						</div>
					{:else}
						<div class="table-responsive">
							<table class="table table-hover mb-0">
								<thead class="table-light">
									<tr>
										<th scope="col" class="fw-semibold">Time</th>
										<th scope="col" class="fw-semibold">User</th>
										<th scope="col" class="fw-semibold">Filename</th>
										<th scope="col" class="fw-semibold">Status</th>
										<th scope="col" class="fw-semibold">Location</th>
										{#if isAdmin}
											<th scope="col" class="fw-semibold" style="width: 60px;">Actions</th>
										{/if}
									</tr>
								</thead>
								<tbody>
									{#each downloadLogs as log (log.id)}
										<tr>
											<td>
												<small class="text-muted">
													{formatTimestamp(log.timestamp)}
												</small>
											</td>
											<td>
												<span class="fw-medium">{log.user_email || 'Unknown'}</span>
											</td>
											<td>
												<span class="text-truncate" style="max-width: 150px;" title={log.file_name || 'Unknown'}>
													{log.file_name || 'Unknown'}
												</span>
											</td>
											<td>
												{#if log.success}
													<span class="badge bg-success">
														<i class="me-1">✓</i>
														Success
													</span>
												{:else}
													<span class="badge bg-danger">
														<i class="me-1">✗</i>
														Failed
													</span>
												{/if}
											</td>
											<td>
												<small class="text-muted">
													{log.location || 'Unknown'}
												</small>
											</td>
											{#if isAdmin}
												<td>
													<button
														type="button"
														class="btn btn-sm btn-outline-danger"
														title="Delete log entry"
														on:click={() => deleteLog(log.id)}
													>
														🗑️
													</button>
												</td>
											{/if}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Admin Modal -->
{#if showAdminModal}
	<div class="modal fade show" style="display: block;" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">
						<i class="me-2">⚙️</i>
						Generate Download Code
					</h5>
					<button
						type="button"
						class="btn-close"
						on:click={() => showAdminModal = false}
					></button>
				</div>
				<div class="modal-body">
					<form on:submit|preventDefault={handleAdminUpload}>
						<div class="row">
							<!-- Recipient Selection -->
							<div class="col-md-6 mb-3">
								<label for="recipientSelect" class="form-label fw-semibold">Recipient</label>
								<select
									class="form-select"
									id="recipientSelect"
									bind:value={selectedRecipient}
									disabled={isUploading}
									required
								>
									<option value="">Select recipient...</option>
									{#each predefinedUsers as user}
										<option value={user.email}>{user.name} ({user.email})</option>
									{/each}
								</select>
							</div>

							<div class="col-md-6 mb-3">
								<label for="codeDescription" class="form-label fw-semibold">Description (Optional)</label>
								<input
									type="text"
									class="form-control"
									id="codeDescription"
									bind:value={codeDescription}
									placeholder="e.g., Q4 Report"
									disabled={isUploading}
								/>
							</div>

							<!-- File Selection Mode -->
							<div class="col-12 mb-3">
								<label class="form-label fw-semibold">File Source</label>
								<div class="btn-group w-100" role="group">
									<input
										type="radio"
										class="btn-check"
										id="uploadMode"
										bind:group={fileSelectionMode}
										value="upload"
									/>
									<label class="btn btn-outline-primary" for="uploadMode">Upload New File</label>

									<input
										type="radio"
										class="btn-check"
										id="existingMode"
										bind:group={fileSelectionMode}
										value="existing"
										on:change={loadExistingFiles}
									/>
									<label class="btn btn-outline-primary" for="existingMode">Use Existing File</label>
								</div>
							</div>

							<!-- Upload File Section -->
							{#if fileSelectionMode === 'upload'}
								<div class="col-12 mb-3">
									<label for="fileInput" class="form-label fw-semibold">Select File</label>
									<input
										type="file"
										class="form-control"
										id="fileInput"
										on:change={handleFileSelect}
										disabled={isUploading}
									/>
									{#if selectedFile}
										<div class="form-text">
											Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
										</div>
									{/if}
								</div>
							{/if}

							<!-- Existing File Selection -->
							{#if fileSelectionMode === 'existing'}
								<div class="col-12 mb-3">
									<label for="existingFileSelect" class="form-label fw-semibold">Select Existing File</label>
									{#if isLoadingFiles}
										<div class="text-center py-3">
											<span class="spinner-border spinner-border-sm me-2" role="status"></span>
											Loading files...
										</div>
									{:else if existingFiles.length > 0}
										<select
											class="form-select"
											id="existingFileSelect"
											bind:value={selectedExistingFile}
											disabled={isUploading}
										>
											<option value="">Choose existing file...</option>
											{#each existingFiles as file}
												<option value={file.key}>{file.name} ({file.size})</option>
											{/each}
										</select>
									{:else}
										<div class="alert alert-info">
											No files found in storage
										</div>
									{/if}
								</div>
							{/if}
						</div>

						{#if uploadError}
							<div class="alert alert-danger" role="alert">
								<strong>Error:</strong> {uploadError}
							</div>
						{/if}

						{#if uploadSuccess}
							<div class="alert alert-success" role="alert">
								<strong>Success:</strong> {uploadSuccess}
							</div>
						{/if}

						<div class="alert alert-info" role="alert">
							<h6 class="alert-heading mb-2">
								<i class="me-1">ℹ️</i>
								Important Notes
							</h6>
							<ul class="mb-0 small">
								<li>Download codes are generated for one-time use only</li>
								<li>Files will be securely stored in R2 bucket</li>
								<li>The recipient will receive the download code to use</li>
								<li>All download attempts will be logged for security</li>
							</ul>
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button
						type="button"
						class="btn btn-secondary"
						on:click={() => showAdminModal = false}
						disabled={isUploading}
					>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-primary"
						on:click={handleAdminUpload}
						disabled={isUploading || !selectedRecipient.trim() ||
							(fileSelectionMode === 'upload' && !selectedFile) ||
							(fileSelectionMode === 'existing' && !selectedExistingFile)}
					>
						{#if isUploading}
							<span class="spinner-border spinner-border-sm me-2" role="status"></span>
							Uploading...
						{:else}
							<i class="me-2">🔗</i>
							Generate Code
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
	<div class="modal-backdrop fade show"></div>
{/if}

<style>
	.card {
		border: none;
		border-radius: 8px;
	}

	.card-header {
		border-radius: 8px 8px 0 0 !important;
	}

	.input-group .form-control {
		border-right: none;
	}

	.input-group .btn {
		border-left: none;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.table th {
		font-size: 0.875rem;
		border-bottom: 2px solid var(--bs-border-color);
	}

	.badge {
		font-size: 0.75rem;
	}
</style>