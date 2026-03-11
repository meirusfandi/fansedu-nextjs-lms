import { TrainerDashboardLayout } from "@/features/dashboard/TrainerDashboardLayout";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerDashboardLayout>{children}</TrainerDashboardLayout>;
}
