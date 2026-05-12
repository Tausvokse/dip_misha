
export const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export type Role = typeof Role[keyof typeof Role];

export const ParkingSpotStatus = { FREE: 'FREE', LOCKED: 'LOCKED', RESERVED: 'RESERVED', MAINTENANCE: 'MAINTENANCE' } as const;
export type ParkingSpotStatus = typeof ParkingSpotStatus[keyof typeof ParkingSpotStatus];

export const ReservationStatus = { PENDING_PAYMENT: 'PENDING_PAYMENT', RESERVED: 'RESERVED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED', COMPLETED: 'COMPLETED' } as const;
export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

export const PaymentMethodType = { CARD: 'CARD', APPLE_PAY: 'APPLE_PAY', GOOGLE_PAY: 'GOOGLE_PAY' } as const;
export type PaymentMethodType = typeof PaymentMethodType[keyof typeof PaymentMethodType];

export const CardBrand = { VISA: 'VISA', MASTERCARD: 'MASTERCARD' } as const;
export type CardBrand = typeof CardBrand[keyof typeof CardBrand];
