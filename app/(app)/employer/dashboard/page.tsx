import { redirect } from "next/navigation";

/** Legacy employer entry → Client Portal */
export default function EmployerDashboardRedirect() {
  redirect("/client/dashboard");
}
