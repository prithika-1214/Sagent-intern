export const readFileAsDataUrl = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        const percent = Math.round((event.loaded / event.total) * 90);
        onProgress(percent);
      }
    };

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected file."));

    reader.readAsDataURL(file);
  });

export const openDocument = (fileUrl) => {
  if (!fileUrl) {
    return;
  }

  const value = String(fileUrl).trim();
  if (!value) {
    return;
  }

  const isDataUrl = value.startsWith("data:");
  const isBlobUrl = value.startsWith("blob:");
  const isHttpUrl = /^https?:\/\//i.test(value);
  const isAbsolutePath = value.startsWith("/");

  if (isDataUrl || isBlobUrl || isHttpUrl || isAbsolutePath) {
    window.open(value, "_blank", "noopener,noreferrer");
  }
};
