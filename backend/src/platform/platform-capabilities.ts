import { PLATFORM_RESOURCES } from '../database/entities/platform-record.entity';

/**
 * Public service catalogue used by portals and integrators to discover the API.
 * "native" domains have purpose-built validation/workflows; "record" domains
 * are available through the flexible /platform/:resource CRUD API.
 */
export const PLATFORM_CAPABILITIES = {
  service: 'Maps Kayz Fashions API',
  version: '1.0.0',
  documentation: '/docs',
  scope: {
    requirements: 'Complete Advanced System Requirements',
    paymentServices: 'excluded',
    externalAdapters: 'require provider credentials and production configuration',
  },
  nativeDomains: {
    authentication: '/api/auth',
    products: '/api/products',
    categories: '/api/categories',
    customers: '/api/customers',
    orders: '/api/orders',
    inventoryDeliveriesReturns: '/api/operations',
    promotions: '/api/promotions',
    administration: '/api/admin/dashboard',
    whatsapp: '/api/whatsapp/order-message',
  },
  recordApi: {
    basePath: '/api/platform/:resource',
    operations: ['list', 'get', 'create', 'update', 'delete'],
    resources: PLATFORM_RESOURCES,
  },
  fulfilmentMethods: [
    'Same-day Bulawayo delivery', 'Standard Bulawayo delivery',
    'Nationwide courier delivery', 'Branch collection', 'Collection-point pickup',
  ],
} as const;
