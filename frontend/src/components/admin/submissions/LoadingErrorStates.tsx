/**
 * Admin submissions: re-export shared loading/error UI with a stable import path.
 * Extra actions (e.g. Use Mock Data) are supported via props on `ErrorState` in
 * `@/components/ui/LoadingErrorStates`.
 */
export {
  LoadingState,
  ErrorState,
  EmptyState,
  LoadingErrorStates,
} from "@/components/ui/LoadingErrorStates";
