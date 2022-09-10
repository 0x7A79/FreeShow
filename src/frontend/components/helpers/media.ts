// ----- FreeShow -----
// This is for media/file functions

export function getExtension(path: string): string {
  if (!path) return ""
  return path.substring(path.lastIndexOf(".") + 1)
}

export function removeExtension(name: string): string {
  if (name.indexOf(".") < 0) return name
  return name.slice(0, name.lastIndexOf("."))
}

export function getFileName(path: string): string {
  if (path.indexOf("\\") > -1) return path.substring(path.lastIndexOf("\\"))
  if (path.indexOf("/") > -1) return path.substring(path.lastIndexOf("/"))
  return path
}
