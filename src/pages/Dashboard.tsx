import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { isAdmin } from "@/signals/auth";

const Dashboard = () => {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-6 text-green-500" />
            Login Successful
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the Internal Metrics Dashboard. You are logged in as{" "}
            <span className="font-semibold">
              {isAdmin.value ? "Admin" : "User"}
            </span>
            .
          </p>
        </CardContent>
      </Card>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[50vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  );
};

export default Dashboard;
