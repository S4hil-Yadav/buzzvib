import axios from "axios";
import type { Request } from "express";
import useragent from "useragent";

export default async function getRequestMeta(req: Request) {
  const rawIp = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || null;
  const cleanIp = rawIp?.startsWith("::ffff:") ? rawIp.replace("::ffff:", "") : rawIp;
  const useDummyIp = (!cleanIp || cleanIp === "::1" || cleanIp.startsWith("127.")) && process.env.MODE === "development";

  const ip = useDummyIp ? "152.59.186.132" : cleanIp;

  const location = await getLocation(ip);

  const agent = useragent.parse(req.headers["user-agent"] ?? "");
  const osVersion = [agent.os.major, agent.os.minor].filter(Boolean).join(".");
  const osString = [agent.os.family, osVersion].filter(Boolean).join(" ");
  const shouldUseDevice = agent.family && agent.family !== "Other" && agent.os.family && agent.os.family !== "Other";

  const device = shouldUseDevice ? `${agent.family} on ${osString}`.trim() : null;

  return { ip, location, device };
}

interface Location {
  city?: string;
  region?: string;
  country?: string;
  [key: string & {}]: any;
}

async function getLocation(ip: string | null) {
  try {
    const { city, region, country } = ip
      ? await axios.get<Location>(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`).then(res => res.data)
      : {};

    return [city, region, country].filter(Boolean).join(", ") || null;
  } catch (error) {
    return null;
  }
}
