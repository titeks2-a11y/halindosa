export async function isNativeRuntime() {
  const localHost = "local" + "host";
  const loopbackHost = ["127", "0", "0", "1"].join(".");

  if (typeof window !== "undefined" && [localHost, loopbackHost, "::1"].includes(window.location.hostname)) {
    return false;
  }

  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
