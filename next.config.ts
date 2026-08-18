const isVercelBuild = process.env.VERCEL === "1";

export default isVercelBuild
  ? { output: "export" as const }
  : {};
