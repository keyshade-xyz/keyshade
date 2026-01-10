export const FILE_UPLOAD_SERVICE = 'FILE_UPLOAD_SERVICE'

/**
 * Defines the contract for a file storage service.
 * This interface abstracts the underlying file storage provider (e.g., local disk, Azure Blob Storage),
 * allowing for consistent file operations across different environments.
 */
export interface FileUploadService {
  /**
   * Uploads an array of files to the storage provider.
   *
   * @param files An array of `File` objects to be uploaded.
   * @param path The base path or directory within the storage provider where the files should be stored.
   * @param expiresAfter The number of seconds after which the uploaded files should expire.
   *        Note: This may not be supported by all providers (e.g., local file system).
   * @returns A promise that resolves to an array of keys, where each key uniquely identifies an uploaded file.
   */
  uploadFiles(
    files: File[],
    path: string,
    expiresAfter: number
  ): Promise<string[]>

  /**
   * Retrieves an array of files from the storage provider based on their keys.
   *
   * @param keys An array of unique string identifiers for the files to retrieve.
   * @returns A promise that resolves to an array of `File` objects. If a key is not found, it is omitted from the result.
   */
  getFiles(keys: string[]): Promise<File[]>

  /**
   * Deletes multiple files from the storage provider.
   *
   * @param keys An array of unique string identifiers for the files to be deleted.
   * @returns A promise that resolves when the deletion operation is complete. It does not reject if a file is not found.
   */
  deleteFiles(keys: string[]): Promise<void>

  /**
   * Generates publicly accessible or pre-signed URLs for an array of files.
   *
   * @param keys An array of unique string identifiers for the files.
   * @returns A promise that resolves to an array of URL strings. These URLs can be used to access the files directly.
   */
  getFileUrls(keys: string[]): Promise<string[]>
}
