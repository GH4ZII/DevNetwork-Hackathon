export type Session = {
  lastScanId?: string;
  lastUserImageUri?: string;
  lastShopUrl?: string;
  lastResultImageUrl?: string;
  lastProductTitle?: string;
  lastProductImageUrl?: string;
  lastGarmentCategory?: string;
  pendingScanUri?: string;
  pendingTryOnImageUrl?: string;
  continueCollectionId?: string;
  continueBaseImageUri?: string;
};

export const session: Session = {};

export function clearContinueLook(): void {
  session.continueCollectionId = undefined;
  session.continueBaseImageUri = undefined;
}
