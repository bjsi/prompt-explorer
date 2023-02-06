import { LoadingSpinner, renderWidget } from '@remnote/plugin-sdk';

export function Loading() {
  return (
    <div className="pl-2">
      <LoadingSpinner></LoadingSpinner>;
    </div>
  );
}

renderWidget(Loading);
