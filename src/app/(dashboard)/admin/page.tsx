import { redirect } from "next/navigation";

// Le dashboard admin redirige vers la liste des utilisateurs
export default function AdminPage() {
  redirect("/admin/users");
}
