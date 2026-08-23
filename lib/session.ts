export type Session = {
  lastScanId?: string;
  lastUserImageUri?: string;
  lastShopUrl?: string;
  lastResultImageUrl?: string;
  pendingScanUri?: string;
};

export const session: Session = {};
