// MongoDB initialization script
// Runs on first container start when data volume is empty

db = db.getSiblingDB('legallens');

// Create collections with schema validation hints
db.createCollection('users');
db.createCollection('organizations');
db.createCollection('documents');
db.createCollection('chunks_metadata');
db.createCollection('bookmarks');
db.createCollection('activity');
db.createCollection('search_history');
db.createCollection('llm_configs');

// Indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ organization_id: 1 });

// Indexes for organizations
db.organizations.createIndex({ slug: 1 }, { unique: true });
db.organizations.createIndex({ owner_id: 1 });

// Indexes for documents
db.documents.createIndex({ document_id: 1 }, { unique: true });
db.documents.createIndex({ organization_id: 1 });
db.documents.createIndex({ organization_id: 1, status: 1 });

// Indexes for chunks_metadata
db.chunks_metadata.createIndex({ document_id: 1 });
db.chunks_metadata.createIndex({ chunk_id: 1 }, { unique: true });

// Indexes for bookmarks
db.bookmarks.createIndex({ user_id: 1, organization_id: 1 });
db.bookmarks.createIndex({ organization_id: 1, matter: 1 });

// Indexes for activity (with TTL — auto-delete after 90 days)
db.activity.createIndex({ organization_id: 1 });
db.activity.createIndex({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

// Indexes for search_history (with TTL — auto-delete after 90 days)
db.search_history.createIndex({ organization_id: 1 });
db.search_history.createIndex({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

// Indexes for llm_configs
db.llm_configs.createIndex({ organization_id: 1 }, { unique: true });

print('LegalLens MongoDB initialization complete');
