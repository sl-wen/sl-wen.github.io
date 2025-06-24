export function getVisitCount(): Promise<number>;
export function incrementVisitCount(): Promise<void>;
export function recordPageView(pageId: string): Promise<void>;