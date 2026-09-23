import { NextResponse } from "next/server";
import { register } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
    name?: string;
  } | null;
  if (!body || !body.email || !body.password) {
    return NextResponse.json({ error: "邮箱和密码必填" }, { status: 400 });
  }
  const result = await register(body.email, body.password, body.name ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ user: result.user });
}
