import { redirect } from "next/navigation";

export default function RootPage() {
  // 根入口直接进入官网
  redirect("/www");
}
