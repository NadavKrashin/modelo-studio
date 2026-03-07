import type { Order, OrderStatus } from '@/lib/types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    orderNumber: 'MDL-2025-001',
    items: [
      {
        id: 'ci-001',
        modelId: 'mdl-002',
        modelName: 'Dragon Figurine - Articulated',
        localizedModelName: 'דמות דרקון מפרקית',
        thumbnailUrl: '',
        sourceName: 'Modelo',
        customization: {
          filamentId: 'fil-pla-red',
          dimensions: { widthMm: 200, heightMm: 80, depthMm: 60 },
          scale: 1,
        },
        quantity: 2,
        unitPrice: 55,
        subtotal: 110,
        addedAt: '2025-03-01T10:00:00Z',
      },
    ],
    customer: {
      fullName: 'יוסי כהן',
      email: 'yossi@example.com',
      phone: '050-1234567',
      address: 'רחוב הרצל 15',
      city: 'תל אביב',
      zipCode: '6120101',
    },
    deliveryMethod: 'shipping',
    status: 'in_production',
    subtotal: 110,
    shippingCost: 0,
    total: 110,
    customerNotes: 'בבקשה לארוז היטב',
    requiresApproval: false,
    createdAt: '2025-03-01T10:30:00Z',
    updatedAt: '2025-03-03T14:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2025-03-01T10:30:00Z' },
      { status: 'pending_approval', timestamp: '2025-03-01T11:00:00Z' },
      { status: 'in_production', timestamp: '2025-03-03T14:00:00Z' },
    ],
  },
  {
    id: 'ord-002',
    orderNumber: 'MDL-2025-002',
    items: [
      {
        id: 'ci-002',
        modelId: 'mdl-009',
        modelName: 'Name Keychain Generator',
        localizedModelName: 'מחזיק מפתחות עם שם',
        thumbnailUrl: '',
        sourceName: 'Modelo',
        customization: {
          filamentId: 'fil-pla-blue',
          dimensions: { widthMm: 60, heightMm: 25, depthMm: 5 },
          scale: 1,
          embossedText: 'דניאל',
        },
        quantity: 5,
        unitPrice: 23,
        subtotal: 115,
        addedAt: '2025-03-02T15:00:00Z',
      },
    ],
    customer: {
      fullName: 'מיכל לוי',
      email: 'michal@example.com',
      phone: '052-9876543',
      city: 'ירושלים',
    },
    deliveryMethod: 'pickup',
    status: 'pending_approval',
    subtotal: 115,
    shippingCost: 0,
    total: 115,
    customerNotes: 'הטקסט צריך להיות בולט וברור',
    requiresApproval: true,
    createdAt: '2025-03-02T15:30:00Z',
    updatedAt: '2025-03-02T15:30:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2025-03-02T15:30:00Z' },
      { status: 'pending_approval', timestamp: '2025-03-02T16:00:00Z' },
    ],
  },
  {
    id: 'ord-003',
    orderNumber: 'MDL-2025-003',
    items: [
      {
        id: 'ci-003',
        modelId: 'mdl-008',
        modelName: 'Geometric Succulent Planter',
        localizedModelName: 'עציץ סוקולנטים גיאומטרי',
        thumbnailUrl: '',
        sourceName: 'Modelo',
        customization: {
          filamentId: 'fil-petg-white',
          dimensions: { widthMm: 140, heightMm: 110, depthMm: 140 },
          scale: 1.4,
        },
        quantity: 1,
        unitPrice: 52,
        subtotal: 52,
        addedAt: '2025-03-04T09:00:00Z',
      },
      {
        id: 'ci-004',
        modelId: 'mdl-014',
        modelName: 'Voronoi Lampshade',
        localizedModelName: 'אהיל ורונוי',
        thumbnailUrl: '',
        sourceName: 'Modelo',
        customization: {
          filamentId: 'fil-pla-white',
          dimensions: { widthMm: 180, heightMm: 200, depthMm: 180 },
          scale: 1,
        },
        quantity: 1,
        unitPrice: 55,
        subtotal: 55,
        addedAt: '2025-03-04T09:05:00Z',
      },
    ],
    customer: {
      fullName: 'רונית שמעוני',
      email: 'ronit@example.com',
      phone: '054-5551234',
      address: 'שדרות בן גוריון 42',
      city: 'חיפה',
      zipCode: '3303500',
    },
    deliveryMethod: 'shipping',
    status: 'completed',
    subtotal: 107,
    shippingCost: 0,
    total: 107,
    requiresApproval: false,
    createdAt: '2025-03-04T09:30:00Z',
    updatedAt: '2025-03-06T16:00:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2025-03-04T09:30:00Z' },
      { status: 'in_production', timestamp: '2025-03-04T12:00:00Z' },
      { status: 'printed', timestamp: '2025-03-05T18:00:00Z' },
      { status: 'shipped', timestamp: '2025-03-06T10:00:00Z' },
      { status: 'completed', timestamp: '2025-03-06T16:00:00Z' },
    ],
  },
  {
    id: 'ord-004',
    orderNumber: 'MDL-2025-004',
    items: [
      {
        id: 'ci-005',
        modelId: 'mdl-004',
        modelName: 'Flexi Rex - Flexible T-Rex',
        localizedModelName: 'פלקסי רקס - טירנוזאורוס גמיש',
        thumbnailUrl: '',
        sourceName: 'Modelo',
        customization: {
          filamentId: 'fil-pla-green',
          dimensions: { widthMm: 180, heightMm: 70, depthMm: 50 },
          scale: 1,
        },
        quantity: 3,
        unitPrice: 30,
        subtotal: 90,
        addedAt: '2025-03-05T11:00:00Z',
      },
    ],
    customer: {
      fullName: 'אבי ברק',
      email: 'avi@example.com',
      phone: '053-7778899',
      city: 'באר שבע',
    },
    deliveryMethod: 'pickup',
    status: 'received',
    subtotal: 90,
    shippingCost: 0,
    total: 90,
    customerNotes: 'מתנות ליום הולדת',
    requiresApproval: false,
    createdAt: '2025-03-05T11:30:00Z',
    updatedAt: '2025-03-05T11:30:00Z',
    statusHistory: [
      { status: 'received', timestamp: '2025-03-05T11:30:00Z' },
    ],
  },
];

const ordersMap = new Map<string, Order>(MOCK_ORDERS.map((o) => [o.orderNumber, o]));

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return ordersMap.get(orderNumber);
}

export function getOrdersByStatus(status: OrderStatus): Order[] {
  return MOCK_ORDERS.filter((o) => o.status === status);
}

export function getAllOrders(): Order[] {
  return [...MOCK_ORDERS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
