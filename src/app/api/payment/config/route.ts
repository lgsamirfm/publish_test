import { jsonOk } from "@/lib/api";
import { simulatedPaymentsEnabled } from "@/lib/payment";

export async function GET() {
  return jsonOk({
    onlinePaymentsEnabled: simulatedPaymentsEnabled(),
    simulated: simulatedPaymentsEnabled(),
    cashOnDeliveryEnabled: true,
  });
}
