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

  if (fileUrl.startsWith("data:")) {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    return;
  }

  window.open(fileUrl, "_blank", "noopener,noreferrer");
};
