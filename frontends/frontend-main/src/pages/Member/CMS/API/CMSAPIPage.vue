<template>
  <expanded-nav-page-container>
    <div class="api-page">
      <!-- Page Header -->
      <div class="page-header q-mb-md">
        <div class="row items-center justify-between">
          <div>
            <h1 class="text-h5 text-weight-medium q-ma-none">API Management</h1>
            <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">
              Manage your API tokens and explore endpoint documentation
            </p>
          </div>
          <q-btn 
            icon="o_refresh"
            label="Regenerate Token"
            color="primary"
            unelevated
            size="sm"
            @click="showRegenerateDialog = true"
            :loading="regeneratingToken"
            class="q-px-md"
          />
        </div>
      </div>

      <!-- API Tokens Section -->
      <q-card flat bordered class="q-mb-md token-section-card">
        <q-card-section class="q-pa-md">
          <div class="row items-center q-mb-md">
            <q-icon name="o_key" size="20px" color="primary" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-medium">Your API Tokens</span>
            <q-space />
            <q-chip 
              v-if="!tokenLoading"
              :color="tokens ? 'positive' : 'negative'"
              text-color="white"
              size="sm"
              class="status-chip"
            >
              {{ tokens ? 'Active' : 'Loading' }}
            </q-chip>
          </div>

          <!-- Loading State -->
          <div v-if="tokenLoading" class="text-center q-py-md">
            <q-spinner size="24px" color="primary" />
            <div class="q-mt-sm text-caption text-grey-7">Loading API tokens...</div>
          </div>

          <!-- Dual Token Display -->
          <div v-else class="tokens-display">
            <!-- Read-Only Token -->
            <div class="token-section q-mb-md">
              <div class="token-header q-mb-sm">
                <div class="row items-center">
                  <q-chip label="Read-Only Token" color="green" text-color="white" size="sm" class="q-mr-sm token-type-chip" />
                  <span class="text-caption text-grey-6">For GET requests and testing - Always visible</span>
                </div>
              </div>
              <q-input
                :model-value="readOnlyToken"
                filled
                readonly
                bg-color="grey-1"
                class="token-input"
              >
                <template v-slot:append>
                  <q-btn 
                    icon="o_content_copy"
                    flat
                    round
                    size="sm"
                    @click="copyReadOnlyToken"
                    :disable="!readOnlyToken || readOnlyToken.includes('Loading')"
                  >
                    <q-tooltip>Copy read-only token</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <div v-if="tokens?.readOnly" class="row q-gutter-sm text-caption text-grey-6 q-mt-xs token-meta">
                <div>
                  <strong>Created:</strong> {{ formatDate(tokens.readOnly.createdAt) }}
                </div>
                <div v-if="tokens.readOnly.lastUsedAt">
                  <strong>Last used:</strong> {{ formatDate(tokens.readOnly.lastUsedAt) }}
                </div>
                <div v-else>
                  <strong>Last used:</strong> Never
                </div>
              </div>
            </div>

            <!-- Full Access Token -->
            <div class="token-section">
              <div class="token-header q-mb-sm">
                <div class="row items-center">
                  <q-chip label="Full-Access Token" color="orange" text-color="white" size="sm" class="q-mr-sm token-type-chip" />
                  <span class="text-caption text-grey-6">For all operations - Hidden for security</span>
                </div>
              </div>
              <q-input
                :model-value="displayFullAccessToken"
                filled
                readonly
                bg-color="grey-1"
                class="token-input"
              >
                <template v-slot:prepend>
                  <q-icon :name="fullTokenVisible ? 'o_visibility_off' : 'o_visibility'" 
                          @click="toggleFullTokenVisibility" 
                          class="cursor-pointer" />
                </template>
                <template v-slot:append>
                  <q-btn 
                    icon="o_content_copy"
                    flat
                    round
                    size="sm"
                    @click="copyFullAccessToken"
                    :disable="!canCopyFullToken"
                  >
                    <q-tooltip>Copy full-access token</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
              <div v-if="tokens?.fullAccess" class="row q-gutter-sm text-caption text-grey-6 q-mt-xs token-meta">
                <div>
                  <strong>Created:</strong> {{ formatDate(tokens.fullAccess.createdAt) }}
                </div>
                <div v-if="tokens.fullAccess.lastUsedAt">
                  <strong>Last used:</strong> {{ formatDate(tokens.fullAccess.lastUsedAt) }}
                </div>
                <div v-else>
                  <strong>Last used:</strong> Never
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Documentation Tabs -->
      <q-card flat bordered class="documentation-card">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-8 compact-tabs"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="authentication" class="compact-tab">
            <div class="row items-center no-wrap">
              <q-icon name="o_security" size="16px" class="q-mr-xs" />
              <span class="text-caption text-weight-medium">Authentication</span>
            </div>
          </q-tab>
          <q-tab name="endpoints" class="compact-tab">
            <div class="row items-center no-wrap">
              <q-icon name="o_api" size="16px" class="q-mr-xs" />
              <span class="text-caption text-weight-medium">Content APIs</span>
            </div>
          </q-tab>
          <q-tab name="examples" class="compact-tab">
            <div class="row items-center no-wrap">
              <q-icon name="o_code" size="16px" class="q-mr-xs" />
              <span class="text-caption text-weight-medium">Code Examples</span>
            </div>
          </q-tab>
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated>
          <!-- Authentication Tab -->
          <q-tab-panel name="authentication" class="q-pa-md">
            <div class="text-subtitle1 q-mb-sm">API Authentication</div>
            
            <q-card flat bordered class="q-mb-sm info-card">
              <q-card-section class="q-pa-md">
                <div class="text-body2 text-weight-medium q-mb-xs">Authentication Header</div>
                <p class="text-caption text-grey-7 q-mb-sm">
                  Include your API token in the request headers using the <code>x-api-key</code> header:
                </p>
                
                <q-card flat class="bg-grey-1 q-pa-sm code-card">
                  <pre class="code-block"><code>x-api-key: {{ apiToken || 'your-api-token-here' }}</code></pre>
                </q-card>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="q-mb-sm info-card">
              <q-card-section class="q-pa-md">
                <div class="text-body2 text-weight-medium q-mb-xs">Base URL</div>
                <p class="text-caption text-grey-7 q-mb-sm">
                  All API endpoints are available at:
                </p>
                
                <q-card flat class="bg-grey-1 q-pa-sm code-card">
                  <pre class="code-block"><code>{{ baseApiUrl }}/api/public</code></pre>
                </q-card>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="info-card">
              <q-card-section class="q-pa-md">
                <div class="text-body2 text-weight-medium q-mb-xs">Response Format</div>
                <p class="text-caption text-grey-7 q-mb-sm">
                  All API responses follow this standard format:
                </p>
                
                <q-card flat class="bg-grey-1 q-pa-sm code-card">
                  <pre class="code-block"><code>{
  "statusCode": 200,
  "message": "Success",
  "data": { /* Your data here */ },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "pageCount": 5
  }
}</code></pre>
                </q-card>
              </q-card-section>
            </q-card>
          </q-tab-panel>

          <!-- Content APIs Tab -->
          <q-tab-panel name="endpoints" class="q-pa-md">
            <div class="text-subtitle1 q-mb-sm">Dynamic Content APIs</div>
            <p class="text-caption text-grey-7 q-mb-md">
              These endpoints are automatically generated based on your content types. 
              Each content type gets its own set of CRUD operations.
            </p>

            <!-- Loading State -->
            <div v-if="contentTypesLoading" class="text-center q-pa-md">
              <q-spinner size="32px" color="primary" />
              <div class="q-mt-sm text-caption text-grey-7">Loading content types...</div>
            </div>

            <!-- Content Types -->
            <div v-else>
              <!-- Collection Types -->
              <div v-if="collectionTypes.length" class="q-mb-lg">
                <div class="text-subtitle1 q-mb-sm">Collection Types</div>
                
                <div v-for="contentType in collectionTypes" :key="contentType.id" class="q-mb-md">
                  <q-card flat bordered class="content-type-card">
                    <q-card-section class="q-pa-md">
                      <div class="row items-center q-mb-sm">
                        <q-icon name="o_collections" class="q-mr-xs" color="primary" size="18px" />
                        <div class="text-subtitle2 text-weight-medium">{{ contentType.displayName }}</div>
                        <q-space />
                        <q-chip color="info" text-color="white" size="sm" class="type-chip">Collection</q-chip>
                      </div>
                      <div class="text-caption text-grey-7 q-mb-md">
                        {{ contentType.description || 'No description available' }}
                      </div>
                      
                      <!-- Interactive Endpoints -->
                      <div class="endpoints-container">
                        <!-- GET List All -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-GET-list`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-GET-list`) : expandedEndpoints.delete(`${contentType.name}-GET-list`)"
                          class="endpoint-expansion q-mb-sm"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="positive" class="method-badge q-mr-sm">GET</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/{{ contentType.name }}</code>
                              <q-space />
                              <span class="text-grey-6">List all entries</span>
                            </div>
                          </template>
                          
                          <!-- GET Request Interface -->
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Parameters</div>
                              
                              <!-- Query Parameters -->
                              <div class="q-mb-md">
                                <div class="text-body2 q-mb-sm"><strong>Query Parameters</strong></div>
                                <div class="row q-gutter-sm">
                                  <q-input 
                                    v-model="queryParams.page" 
                                    label="page" 
                                    dense 
                                    outlined 
                                    placeholder="1"
                                    class="col-md-3 col-sm-6 col-xs-12"
                                  />
                                  <q-input 
                                    v-model="queryParams.pageSize" 
                                    label="pageSize" 
                                    dense 
                                    outlined 
                                    placeholder="20"
                                    class="col-md-3 col-sm-6 col-xs-12"
                                  />
                                  <q-input 
                                    v-model="queryParams.search" 
                                    label="search" 
                                    dense 
                                    outlined 
                                    placeholder="Search term"
                                    class="col-md-6 col-sm-12 col-xs-12"
                                  />
                                </div>
                              </div>
                              
                              <!-- Execute Button -->
                              <q-btn
                                @click="executeRequest(contentType, 'GET')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-GET-list`"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                        
                        <!-- GET Single Entry -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-GET-single`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-GET-single`) : expandedEndpoints.delete(`${contentType.name}-GET-single`)"
                          class="endpoint-expansion q-mb-sm"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="positive" class="method-badge q-mr-sm">GET</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/{{ contentType.name }}/:id</code>
                              <q-space />
                              <span class="text-grey-6">Get single entry</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Parameters</div>
                              <q-input 
                                v-model="pathParams.id" 
                                label="Entry ID" 
                                dense 
                                outlined 
                                placeholder="Enter entry ID"
                                class="q-mb-md"
                                style="max-width: 300px;"
                              />
                              
                              <q-btn
                                @click="executeRequest(contentType, 'GET')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-GET-single`"
                                :disable="!pathParams.id"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                        
                        <!-- POST Create -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-POST`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-POST`) : expandedEndpoints.delete(`${contentType.name}-POST`)"
                          class="endpoint-expansion q-mb-sm"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="info" class="method-badge q-mr-sm">POST</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/{{ contentType.name }}</code>
                              <q-space />
                              <span class="text-grey-6">Create entry</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Body</div>
                              
                              <div class="q-mb-md">
                                <div class="row items-center q-mb-sm">
                                  <span class="text-body2"><strong>JSON Payload</strong></span>
                                  <q-space />
                                  <q-btn
                                    @click="generateSampleData(contentType)"
                                    size="sm"
                                    flat
                                    color="primary"
                                    icon="o_auto_awesome"
                                    dense
                                  >
                                    <q-tooltip>Generate Sample Data</q-tooltip>
                                  </q-btn>
                                </div>
                                <q-input
                                  v-model="requestBody"
                                  type="textarea"
                                  outlined
                                  rows="8"
                                  dense
                                  placeholder='{"title": "Sample Title", "content": "Sample Content"}'
                                  class="json-input"
                                />
                              </div>
                              
                              <q-btn
                                @click="executeRequest(contentType, 'POST')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-POST`"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                        
                        <!-- PUT Update -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-PUT`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-PUT`) : expandedEndpoints.delete(`${contentType.name}-PUT`)"
                          class="endpoint-expansion q-mb-sm"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="warning" class="method-badge q-mr-sm">PUT</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/{{ contentType.name }}/:id</code>
                              <q-space />
                              <span class="text-grey-6">Update entry</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Parameters</div>
                              
                              <q-input 
                                v-model="pathParams.id" 
                                label="Entry ID" 
                                dense 
                                outlined 
                                placeholder="Enter entry ID to update"
                                class="q-mb-md"
                                style="max-width: 300px;"
                              />
                              
                              <div class="q-mb-md">
                                <div class="row items-center q-mb-sm">
                                  <span class="text-body2"><strong>JSON Payload</strong></span>
                                  <q-space />
                                  <q-btn
                                    @click="generateSampleData(contentType)"
                                    size="sm"
                                    flat
                                    color="primary"
                                    icon="o_auto_awesome"
                                    dense
                                  >
                                    <q-tooltip>Generate Sample Data</q-tooltip>
                                  </q-btn>
                                </div>
                                <q-input
                                  v-model="requestBody"
                                  type="textarea"
                                  outlined
                                  rows="8"
                                  dense
                                  placeholder='{"title": "Updated Title", "content": "Updated Content"}'
                                  class="json-input"
                                />
                              </div>
                              
                              <q-btn
                                @click="executeRequest(contentType, 'PUT')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-PUT`"
                                :disable="!pathParams.id"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                        
                        <!-- DELETE -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-DELETE`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-DELETE`) : expandedEndpoints.delete(`${contentType.name}-DELETE`)"
                          class="endpoint-expansion"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="negative" class="method-badge q-mr-sm">DEL</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/{{ contentType.name }}/:id</code>
                              <q-space />
                              <span class="text-grey-6">Delete entry</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Parameters</div>
                              <q-input 
                                v-model="pathParams.id" 
                                label="Entry ID" 
                                dense 
                                outlined 
                                placeholder="Enter entry ID to delete"
                                class="q-mb-md"
                                style="max-width: 300px;"
                              />
                              
                              <q-btn
                                @click="executeRequest(contentType, 'DELETE')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-DELETE`"
                                :disable="!pathParams.id"
                                color="negative"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_delete" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- Single Types -->
              <div v-if="singleTypes.length" class="q-mb-lg">
                <div class="text-subtitle1 q-mb-sm">Single Types</div>
                
                <div v-for="contentType in singleTypes" :key="contentType.id" class="q-mb-md">
                  <q-card flat bordered class="content-type-card">
                    <q-card-section class="q-pa-md">
                      <div class="row items-center q-mb-sm">
                        <q-icon name="o_article" class="q-mr-xs" color="primary" size="18px" />
                        <div class="text-subtitle2 text-weight-medium">{{ contentType.displayName }}</div>
                        <q-space />
                        <q-chip color="purple" text-color="white" size="sm" class="type-chip">Single</q-chip>
                      </div>
                      <div class="text-caption text-grey-7 q-mb-md">
                        {{ contentType.description || 'No description available' }}
                      </div>
                      
                      <!-- Interactive Endpoints -->
                      <div class="endpoints-container">
                        <!-- GET Single Type -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-GET-single-type`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-GET-single-type`) : expandedEndpoints.delete(`${contentType.name}-GET-single-type`)"
                          class="endpoint-expansion q-mb-sm"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="positive" class="method-badge q-mr-sm">GET</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/single/{{ contentType.name }}</code>
                              <q-space />
                              <span class="text-grey-6">Get single type data</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Info</div>
                              <div class="q-mb-md">
                                <div class="text-body2 text-grey-6 q-mb-sm">
                                  This endpoint returns the single instance of this content type.
                                </div>
                              </div>
                              
                              <q-btn
                                @click="executeRequest(contentType, 'GET')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-GET-single-type`"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                        
                        <!-- PUT Update Single Type -->
                        <q-expansion-item
                          :model-value="expandedEndpoints.has(`${contentType.name}-PUT-single-type`)"
                          @update:model-value="(val) => val ? toggleEndpoint(`${contentType.name}-PUT-single-type`) : expandedEndpoints.delete(`${contentType.name}-PUT-single-type`)"
                          class="endpoint-expansion"
                        >
                          <template v-slot:header>
                            <div class="row items-center full-width">
                              <q-badge color="warning" class="method-badge q-mr-sm">PUT</q-badge>
                              <code class="endpoint-url">{{ baseApiUrl }}/api/public/cms/single/{{ contentType.name }}</code>
                              <q-space />
                              <span class="text-grey-6">Update single type</span>
                            </div>
                          </template>
                          
                          <div class="endpoint-content q-pa-md">
                            <!-- Request Section -->
                            <div class="request-section">
                              <div class="text-body2 text-weight-medium q-mb-md">Request Body</div>
                              
                              <div class="q-mb-md">
                                <div class="row items-center q-mb-sm">
                                  <span class="text-body2"><strong>JSON Payload</strong></span>
                                  <q-space />
                                  <q-btn
                                    @click="generateSampleData(contentType)"
                                    size="sm"
                                    flat
                                    color="primary"
                                    icon="o_auto_awesome"
                                    dense
                                  >
                                    <q-tooltip>Generate Sample Data</q-tooltip>
                                  </q-btn>
                                </div>
                                <q-input
                                  v-model="requestBody"
                                  type="textarea"
                                  outlined
                                  rows="8"
                                  dense
                                  placeholder='{"title": "Updated Title", "content": "Updated Content"}'
                                  class="json-input"
                                />
                              </div>
                              
                              <q-btn
                                @click="executeRequest(contentType, 'PUT')"
                                :loading="testingLoading && selectedEndpoint === `${contentType.name}-PUT-single-type`"
                                color="primary"
                                unelevated
                                size="sm"
                                class="q-px-lg"
                              >
                                <q-icon name="o_play_arrow" class="q-mr-sm" />
                                Execute Request
                              </q-btn>
                            </div>
                          </div>
                        </q-expansion-item>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- No Content Types -->
              <div v-if="!collectionTypes.length && !singleTypes.length" class="text-center q-pa-lg empty-state">
                <q-icon name="o_widgets" size="36px" color="grey-5" />
                <div class="text-subtitle2 text-grey-7 q-mt-sm">No Content Types Found</div>
                <div class="text-caption text-grey-6 q-mt-xs q-mb-sm">
                  Create some content types first to see the available API endpoints
                </div>
                <q-btn 
                  label="Content Type Builder" 
                  color="primary" 
                  unelevated
                  size="sm"
                  @click="$router.push({name: 'member_cms_content_type_builder'})"
                />
              </div>
            </div>
          </q-tab-panel>

          <!-- Code Examples Tab -->
          <q-tab-panel name="examples" class="q-pa-md">
            <div class="text-subtitle1 q-mb-sm">Code Examples</div>
            <p class="text-caption text-grey-7 q-mb-md">
              Here are examples of how to use the API in different programming languages.
            </p>

            <!-- Language Selector -->
            <q-select
              v-model="selectedLanguage"
              :options="languageOptions"
              emit-value
              map-options
              outlined
              dense
              class="q-mb-sm language-selector"
              style="max-width: 180px"
            />

            <!-- Examples for JavaScript -->
            <div v-if="selectedLanguage === 'javascript'">
              <q-card flat bordered class="q-mb-sm info-card">
                <q-card-section class="q-pa-md">
                  <div class="text-body2 text-weight-medium q-mb-xs">Fetch API Example</div>
                  <q-card flat class="bg-grey-1 q-pa-sm code-card">
                    <pre class="code-block"><code>// Get all articles
const response = await fetch('{{ baseApiUrl }}/api/public/articles', {
  headers: {
    'x-api-key': '{{ apiToken || 'your-api-token' }}',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);</code></pre>
                  </q-card>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="q-mb-sm info-card">
                <q-card-section class="q-pa-md">
                  <div class="text-body2 text-weight-medium q-mb-xs">Axios Example</div>
                  <q-card flat class="bg-grey-1 q-pa-sm code-card">
                    <pre class="code-block"><code>import axios from 'axios';

const api = axios.create({
  baseURL: '{{ baseApiUrl }}/api/public',
  headers: {
    'x-api-key': '{{ apiToken || 'your-api-token' }}'
  }
});

// Get all articles
const response = await api.get('/articles');
console.log(response.data);</code></pre>
                  </q-card>
                </q-card-section>
              </q-card>
            </div>

            <!-- Examples for cURL -->
            <div v-if="selectedLanguage === 'curl'">
              <q-card flat bordered class="q-mb-sm info-card">
                <q-card-section class="q-pa-md">
                  <div class="text-body2 text-weight-medium q-mb-xs">GET Request</div>
                  <q-card flat class="bg-grey-1 q-pa-sm code-card">
                    <pre class="code-block"><code>curl -X GET "{{ baseApiUrl }}/api/public/articles" \
  -H "x-api-key: {{ apiToken || 'your-api-token' }}" \
  -H "Content-Type: application/json"</code></pre>
                  </q-card>
                </q-card-section>
              </q-card>

              <q-card flat bordered class="q-mb-sm info-card">
                <q-card-section class="q-pa-md">
                  <div class="text-body2 text-weight-medium q-mb-xs">POST Request</div>
                  <q-card flat class="bg-grey-1 q-pa-sm code-card">
                    <pre class="code-block"><code>curl -X POST "{{ baseApiUrl }}/api/public/articles" \
  -H "x-api-key: {{ apiToken || 'your-api-token' }}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Article",
    "content": "Article content here"
  }'</code></pre>
                  </q-card>
                </q-card-section>
              </q-card>
            </div>

            <!-- Examples for Python -->
            <div v-if="selectedLanguage === 'python'">
              <q-card flat bordered class="q-mb-sm info-card">
                <q-card-section class="q-pa-md">
                  <div class="text-body2 text-weight-medium q-mb-xs">Requests Library</div>
                  <q-card flat class="bg-grey-1 q-pa-sm code-card">
                    <pre class="code-block"><code>import requests

headers = {
    'x-api-key': '{{ apiToken || 'your-api-token' }}',
    'Content-Type': 'application/json'
}

# Get all articles
response = requests.get('{{ baseApiUrl }}/api/public/articles', headers=headers)
data = response.json()
print(data)</code></pre>
                  </q-card>
                </q-card-section>
              </q-card>
            </div>
          </q-tab-panel>

        </q-tab-panels>
      </q-card>
    </div>

    <!-- Regenerate Token Dialog -->
    <q-dialog v-model="showRegenerateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Regenerate API Token</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p class="text-body2">
            Are you sure you want to regenerate your API token? This will invalidate the current token 
            and any applications using it will need to be updated.
          </p>
          
          <q-banner inline-actions class="text-white bg-warning q-mt-md">
            <template v-slot:avatar>
              <q-icon name="warning" />
            </template>
            This action cannot be undone.
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showRegenerateDialog = false" />
          <q-btn 
            unelevated 
            label="Regenerate" 
            color="primary" 
            @click="regenerateToken"
            :loading="regeneratingToken"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- Response Dialog -->
    <CMSAPIResponseDialog
      v-model="showResponseDialog"
      :response-data="responseData"
      :response-time="responseTime"
      :request-details="currentRequestDetails"
      @replay-request="handleReplayRequest"
    />
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import CMSAPIResponseDialog from './CMSAPIResponseDialog.vue';
import { CMSContentTypesService } from '../../../../services/cms-content-types.service';
import { CMSAPITokensService, type APIToken } from '../../../../services/cms-api-tokens.service';
import { useConnectionStore } from '../../../../stores/connectionStore';
import type { ContentType } from '@components/shared/cms/types/content-type';

export default defineComponent({
  name: 'CMSAPIPage',
  components: {
    ExpandedNavPageContainer,
    CMSAPIResponseDialog,
  },
  setup() {
    const $q = useQuasar();
    const $router = useRouter();

    // Reactive state
    const activeTab = ref('authentication');
    const showRegenerateDialog = ref(false);
    const regeneratingToken = ref(false);
    const fullTokenVisible = ref(false);
    const selectedLanguage = ref('javascript');
    const contentTypesLoading = ref(true);
    const tokenLoading = ref(true);
    const contentTypes = ref<ContentType[]>([]);
    const connectionStore = useConnectionStore();
    const baseApiUrl = computed(() => connectionStore.apiUrl);
    
    // Dual token system
    const tokens = ref<{ readOnly: APIToken; fullAccess: APIToken } | null>(null);
    const rawTokens = ref<{ readOnly: string | null; fullAccess: string | null }>({
      readOnly: null,
      fullAccess: null,
    });

    // Interactive API Testing State
    const selectedEndpoint = ref<string | null>(null);
    const requestBody = ref<string>('{}');
    const queryParams = ref<Record<string, string>>({});
    const pathParams = ref<Record<string, string>>({});
    const responseData = ref<any>(null);
    const testingLoading = ref(false);
    const expandedEndpoints = ref<Set<string>>(new Set());
    const responseTime = ref<number>(0);
    
    // Dialog state
    const showResponseDialog = ref(false);
    const currentRequestDetails = ref<any>(null);

    const languageOptions = [
      { label: 'JavaScript', value: 'javascript' },
      { label: 'cURL', value: 'curl' },
      { label: 'Python', value: 'python' },
    ];

    // Computed properties for dual tokens
    const readOnlyToken = computed(() => {
      if (!tokens.value?.readOnly) return 'Loading...';
      
      // Use raw token if available, otherwise show message
      if (tokens.value.readOnly.rawToken) {
        return tokens.value.readOnly.rawToken;
      }
      
      return 'No token available - please regenerate';
    });

    const displayFullAccessToken = computed(() => {
      if (!tokens.value?.fullAccess) return 'Loading...';
      
      if (fullTokenVisible.value && rawTokens.value.fullAccess) {
        return rawTokens.value.fullAccess;
      }
      
      // Generate masked display
      const maskedLength = 60;
      return `ante_fa_${'*'.repeat(maskedLength)}`;
    });

    const canCopyFullToken = computed(() => {
      return fullTokenVisible.value && rawTokens.value.fullAccess && !displayFullAccessToken.value.includes('*');
    });

    const apiToken = computed(() => readOnlyToken.value !== 'Loading...' ? readOnlyToken.value : 'your-api-token');

    const collectionTypes = computed(() => 
      contentTypes.value.filter(ct => ct.type === 'collection')
    );

    const singleTypes = computed(() => 
      contentTypes.value.filter(ct => ct.type === 'single')
    );

    // Methods
    const toggleFullTokenVisibility = () => {
      fullTokenVisible.value = !fullTokenVisible.value;
    };

    const copyReadOnlyToken = async () => {
      const tokenToCopy = readOnlyToken.value;
      
      if (tokenToCopy === 'Loading...' || tokenToCopy.includes('No token available')) {
        $q.notify({
          type: 'warning',
          message: 'Read-only token not available',
          position: 'top',
          timeout: 2000
        });
        return;
      }
      
      const success = await CMSAPITokensService.copyToClipboard(tokenToCopy);
      
      $q.notify({
        type: success ? 'positive' : 'negative',
        message: success ? 'Read-only token copied to clipboard' : 'Failed to copy read-only token',
        position: 'top',
        timeout: 2000
      });
    };

    const copyFullAccessToken = async () => {
      if (!canCopyFullToken.value || !rawTokens.value.fullAccess) {
        $q.notify({
          type: 'warning',
          message: 'Full-access token is hidden. Use eye icon to reveal first.',
          position: 'top',
          timeout: 2000
        });
        return;
      }
      
      const success = await CMSAPITokensService.copyToClipboard(rawTokens.value.fullAccess);
      
      $q.notify({
        type: success ? 'positive' : 'negative',
        message: success ? 'Full-access token copied to clipboard' : 'Failed to copy full-access token',
        position: 'top',
        timeout: 2000
      });
    };

    const regenerateToken = async () => {
      if (!tokens.value?.fullAccess) return;
      
      regeneratingToken.value = true;
      try {
        const result = await CMSAPITokensService.regenerateToken({
          tokenId: tokens.value.fullAccess.id,
          name: tokens.value.fullAccess.name,
        });
        
        tokens.value.fullAccess = result.token;
        rawTokens.value.fullAccess = result.rawToken;
        
        $q.notify({
          type: 'positive',
          message: 'Full-access token regenerated successfully',
          position: 'top',
          timeout: 3000
        });
        
        showRegenerateDialog.value = false;
      } catch (error: any) {
        console.error('Error regenerating token:', error);
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to regenerate token',
          position: 'top',
          timeout: 3000
        });
      } finally {
        regeneratingToken.value = false;
      }
    };

    const formatDate = (date: Date | string | undefined) => {
      if (!date) return 'Never';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    // Interactive API Testing Methods
    const toggleEndpoint = (endpointKey: string) => {
      if (expandedEndpoints.value.has(endpointKey)) {
        expandedEndpoints.value.delete(endpointKey);
        if (selectedEndpoint.value === endpointKey) {
          selectedEndpoint.value = null;
          responseData.value = null;
        }
      } else {
        expandedEndpoints.value.add(endpointKey);
        selectedEndpoint.value = endpointKey;
        // Reset state for new endpoint
        requestBody.value = '{}';
        queryParams.value = {};
        pathParams.value = {};
        responseData.value = null;
      }
    };

    const generateSampleData = (contentType: ContentType) => {
      const sampleData: Record<string, any> = {};
      
      if (contentType.fields && contentType.fields.length > 0) {
        contentType.fields.forEach(field => {
          switch (field.type as string) {
            case 'string':
              sampleData[field.name] = `Sample ${field.displayName || field.name}`;
              break;
            case 'text':
              sampleData[field.name] = `This is sample text for ${field.displayName || field.name}`;
              break;
            case 'number':
              sampleData[field.name] = 42;
              break;
            case 'boolean':
              sampleData[field.name] = true;
              break;
            case 'date':
              sampleData[field.name] = new Date().toISOString();
              break;
            case 'email':
              sampleData[field.name] = 'example@domain.com';
              break;
            default:
              sampleData[field.name] = `sample_${field.name}`;
          }
        });
      } else {
        // Basic fallback for content types without defined fields
        sampleData.title = `Sample ${contentType.displayName}`;
        sampleData.content = `This is sample content for ${contentType.displayName}`;
      }
      
      requestBody.value = JSON.stringify(sampleData, null, 2);
    };

    const buildRequestUrl = (contentType: ContentType, method: string) => {
      // Use the new public CMS API endpoints
      let url;
      
      if (contentType.type === 'single') {
        // Single type endpoints
        url = `${baseApiUrl.value}/api/public/cms/single/${contentType.name}`;
      } else {
        // Collection type endpoints  
        url = `${baseApiUrl.value}/api/public/cms/${contentType.name}`;
        
        if (method !== 'GET' && method !== 'POST' && pathParams.value.id) {
          url += `/${pathParams.value.id}`;
        }
      }
      
      if (method === 'GET' && Object.keys(queryParams.value).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams.value).forEach(([key, value]) => {
          if (value.trim()) {
            searchParams.append(key, value);
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }
      
      return url;
    };

    const executeRequest = async (contentType: ContentType, method: string) => {
      if (!tokens.value) {
        $q.notify({
          type: 'warning',
          message: 'API tokens not loaded. Please wait for tokens to load.',
          position: 'top',
          timeout: 3000
        });
        return;
      }

      testingLoading.value = true;
      responseData.value = null;
      
      const startTime = Date.now();
      
      try {
        const url = buildRequestUrl(contentType, method);
        
        // Use appropriate token based on request method
        // GET requests use read-only token, others require full-access token
        const isReadOnlyRequest = method === 'GET';
        const tokenType = isReadOnlyRequest ? 'read-only' : 'full-access';
        
        console.log(`Using ${tokenType} token for ${method} request to ${contentType.name}`);
        
        // Check token availability
        if (isReadOnlyRequest) {
          if (!tokens.value.readOnly?.rawToken) {
            $q.notify({
              type: 'warning',
              message: 'Read-only token not available. Please regenerate the read-only token to test GET endpoints.',
              position: 'top',
              timeout: 4000
            });
            return;
          }
        } else {
          // For security, we don't store raw full-access tokens in the frontend
          $q.notify({
            type: 'info',
            message: 'Full-access token testing not available in UI for security. Use curl or Postman with a regenerated token.',
            position: 'top',
            timeout: 4000
          });
          return;
        }
        
        const requestHeaders: Record<string, string> = {
          'x-api-key': tokens.value.readOnly.rawToken!, // Use read-only API token
          'Content-Type': 'application/json'
        };

        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
        };

        // Note: Only GET requests are supported in UI testing for security.
        // POST/PUT/DELETE should be tested with external tools like curl or Postman.

        const response = await fetch(url, requestOptions);
        const responseBody = await response.text();
        
        responseTime.value = Date.now() - startTime;
        
        let parsedBody;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch (e) {
          parsedBody = responseBody;
        }

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        responseData.value = {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
          body: parsedBody,
          url: url,
          method: method
        };
        
        // Store request details for dialog
        currentRequestDetails.value = {
          headers: requestHeaders,
          body: method !== 'GET' && requestOptions.body ? JSON.parse(requestOptions.body as string) : null
        };
        
        // Open response dialog
        showResponseDialog.value = true;

        $q.notify({
          type: response.ok ? 'positive' : 'negative',
          message: `${method} request ${response.ok ? 'successful' : 'failed'} (${response.status})`,
          position: 'top',
          timeout: 3000
        });

      } catch (error: any) {
        responseTime.value = Date.now() - startTime;
        responseData.value = {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          body: { error: error.message },
          url: buildRequestUrl(contentType, method),
          method: method
        };
        
        // Store request details for dialog
        currentRequestDetails.value = {
          headers: {
            'x-api-key': tokens.value.readOnly.rawToken!,
            'Content-Type': 'application/json'
          },
          body: method !== 'GET' ? requestBody.value : null
        };
        
        // Open response dialog even for errors
        showResponseDialog.value = true;

        $q.notify({
          type: 'negative',
          message: `Request failed: ${error.message}`,
          position: 'top',
          timeout: 5000
        });
      } finally {
        testingLoading.value = false;
      }
    };

    const getStatusColor = (status: number): string => {
      if (status >= 200 && status < 300) return 'positive';
      if (status >= 300 && status < 400) return 'info';
      if (status >= 400 && status < 500) return 'warning';
      if (status >= 500) return 'negative';
      return 'grey';
    };
    
    const handleReplayRequest = () => {
      // Close dialog first
      showResponseDialog.value = false;
      
      // Re-execute the last request
      if (responseData.value && selectedEndpoint.value) {
        const endpointParts = selectedEndpoint.value.split('-');
        const contentTypeName = endpointParts[0];
        const method = endpointParts[1];
        
        const contentType = contentTypes.value.find(ct => ct.name === contentTypeName);
        if (contentType) {
          executeRequest(contentType, method);
        }
      }
    };

    const loadContentTypes = async () => {
      contentTypesLoading.value = true;
      try {
        const allTypes = await CMSContentTypesService.getAll();
        contentTypes.value = allTypes.filter(ct => !ct.deletedAt);
      } catch (error) {
        console.error('Failed to load content types:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load content types',
          position: 'top',
          timeout: 3000
        });
      } finally {
        contentTypesLoading.value = false;
      }
    };

    const loadTokens = async () => {
      tokenLoading.value = true;
      try {
        const tokensData = await CMSAPITokensService.getCurrentTokens();
        tokens.value = tokensData;
        
        // Raw tokens are not available for existing tokens (only after regeneration)
        rawTokens.value = {
          readOnly: null,
          fullAccess: null,
        };
      } catch (error: any) {
        console.error('Error loading API tokens:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load API tokens',
          position: 'top',
          timeout: 3000
        });
      } finally {
        tokenLoading.value = false;
      }
    };

    // Lifecycle
    onMounted(() => {
      loadContentTypes();
      loadTokens();
    });

    return {
      $router,
      activeTab,
      showRegenerateDialog,
      regeneratingToken,
      fullTokenVisible,
      selectedLanguage,
      contentTypesLoading,
      tokenLoading,
      baseApiUrl,
      languageOptions,
      collectionTypes,
      singleTypes,
      contentTypes,
      
      // Dual token system
      tokens,
      readOnlyToken,
      displayFullAccessToken,
      canCopyFullToken,
      apiToken,
      
      // Interactive API Testing
      selectedEndpoint,
      requestBody,
      queryParams,
      pathParams,
      responseData,
      testingLoading,
      expandedEndpoints,
      responseTime,
      
      // Dialog state
      showResponseDialog,
      currentRequestDetails,
      
      // Methods
      toggleFullTokenVisibility,
      copyReadOnlyToken,
      copyFullAccessToken,
      regenerateToken,
      formatDate,
      toggleEndpoint,
      generateSampleData,
      buildRequestUrl,
      executeRequest,
      getStatusColor,
      handleReplayRequest,
    };
  },
});
</script>

<style scoped lang="scss">
.api-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  
  .tokens-display {
    .token-section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      background-color: #fafafa;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      .token-header {
        margin-bottom: 12px;
      }
      
      .token-input {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        
        :deep(.q-field__control) {
          background-color: white;
          border: 1px solid #ddd;
        }
        
        :deep(input) {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
        }
      }
    }
  }
}

.page-header {
  border-bottom: 1px solid var(--q-separator-color);
  padding-bottom: 16px;
}

.token-input {
  font-family: 'Roboto Mono', monospace;
  
  :deep(.q-field__control) {
    font-size: 14px;
  }
}

.code-block {
  margin: 0;
  padding: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
  color: var(--q-dark);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.method-badge {
  min-width: 45px;
  margin-right: 8px;
}

.endpoint-item {
  display: flex;
  align-items: center;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
}

.endpoints code {
  background-color: var(--q-grey-2);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
}

/* Interactive API Documentation Styles */
.endpoint-expansion {
  border: 1px solid var(--q-separator-color);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  
  :deep(.q-expansion-item__container) {
    .q-item {
      padding: 12px 16px;
      min-height: auto;
      
      &:hover {
        background-color: var(--q-grey-1);
      }
    }
  }
  
  :deep(.q-expansion-item__content) {
    background-color: var(--q-grey-1);
    border-top: 1px solid var(--q-separator-color);
  }
}

.endpoint-url {
  background-color: var(--q-grey-2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  margin-right: 12px;
}

.endpoint-content {
  background-color: white;
}

.response-container {
  .response-json {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    margin: 0;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.method-badge {
  min-width: 45px;
  font-weight: 600;
  font-size: 12px;
}

/* Status color utilities */
.text-positive { color: var(--q-positive) !important; }
.text-negative { color: var(--q-negative) !important; }
.text-warning { color: var(--q-warning) !important; }
.text-info { color: var(--q-info) !important; }

/* Endpoint sections styling */
.endpoints-container {
  .q-expansion-item + .q-expansion-item {
    margin-top: 4px;
  }
}

@media (max-width: 768px) {
  .api-page {
    padding: 16px;
  }
  
  .page-header .row {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>