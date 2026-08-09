/**
 * The repository only contains a fake gateway for local UI testing. It is not a
 * payment processor and must never be reachable in a production deployment.
 */
export function simulatedPaymentsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_SIMULATED_PAYMENTS === "true"
  );
}
