<template>
  <q-page class="vendor-management">
    <div class="page-container">
      <!-- Modern Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <h4 class="page-title">Vendor Management</h4>
            <p class="page-subtitle">Manage vendor relationships and performance</p>
          </div>
          <div class="header-actions">
            <q-btn
              icon="refresh"
              label="Refresh"
              outline
              color="primary"
              @click="loadVendors"
              :loading="isLoading"
              class="refresh-btn"
            />
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <q-card flat class="filters-card">
        <q-card-section class="filters-section">
          <div class="filters-grid">
            <!-- Search -->
            <div class="filter-group search-group">
              <SearchChips
                placeholder="Search vendors by name, code, contact..."
                @search="handleSearch"
                @chips-updated="handleChipsUpdated"
                :max-chips="5"
                class="search-chips"
              />
            </div>

            <!-- Primary Filters -->
            <div class="filter-group">
              <q-select
                v-model="filters.vendorType"
                :options="vendorTypeOptions"
                label="Vendor Type"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="business" />
                </template>
              </q-select>
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.vendorCategory"
                :options="vendorCategoryOptions"
                label="Category"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.vendorStatus"
                :options="vendorStatusOptions"
                label="Status"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <div class="filter-group">
              <q-select
                v-model="filters.approvalStatus"
                :options="approvalStatusOptions"
                label="Approval Status"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>

            <!-- Location Filter -->
            <div class="filter-group">
              <q-input
                v-model="filters.city"
                label="City"
                filled
                dense
                debounce="500"
                @update:model-value="applyFilters"
              >
                <template v-slot:prepend>
                  <q-icon name="location_city" />
                </template>
              </q-input>
            </div>

            <!-- Rating Filter -->
            <div class="filter-group">
              <q-select
                v-model="filters.minRating"
                :options="ratingOptions"
                label="Min Rating"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="applyFilters"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <q-btn
              icon="add_business"
              label="Add Vendors"
              color="positive"
              @click="showBulkAddDialog = true"
              class="add-btn"
            />
            <q-btn
              icon="approval"
              label="Bulk Approve"
              color="primary"
              :disable="selectedVendors.length === 0"
              @click="confirmBulkApprove"
              class="approve-btn"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Selection Banner -->
      <div v-if="selectedVendors.length > 0" class="selection-banner">
        <q-banner class="selection-info" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" color="primary" />
          </template>
          <div class="selection-text">
            {{ selectedVendors.length }} vendor{{ selectedVendors.length > 1 ? 's' : '' }} selected
          </div>
          <template v-slot:action>
            <q-btn flat label="Clear" @click="clearSelection" color="primary" />
          </template>
        </q-banner>
      </div>

      <!-- Vendors Table -->
      <q-card flat class="table-card">
        <q-table
          :rows="vendors"
          :columns="columns"
          :loading="isLoading"
          :pagination="pagination"
          :selected="selectedVendors"
          selection="multiple"
          row-key="recCode"
          flat
          @update:selected="selectedVendors = $event"
          @request="onTableRequest"
          class="vendors-table"
        >
          <!-- Header Selection -->
          <template v-slot:header-selection="scope">
            <q-checkbox v-model="scope.selected" />
          </template>

          <!-- Row Selection -->
          <template v-slot:body-selection="scope">
            <q-checkbox
              :model-value="scope.selected"
              @update:model-value="scope.selected = $event"
            />
          </template>

          <!-- Company Name & Code -->
          <template v-slot:body-cell-companyName="props">
            <q-td :props="props">
              <div class="company-info">
                <div class="company-name">{{ props.row.companyName }}</div>
                <div class="vendor-code">{{ props.row.vendorCode }}</div>
              </div>
            </q-td>
          </template>

          <!-- Contact Information -->
          <template v-slot:body-cell-contact="props">
            <q-td :props="props">
              <div class="contact-info">
                <div class="contact-name">{{ props.row.contactPersonName || '-' }}</div>
                <div class="contact-details">
                  <span v-if="props.row.phone">{{ props.row.phone }}</span>
                  <span v-if="props.row.email" class="email">{{ props.row.email }}</span>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Approval Status -->
          <template v-slot:body-cell-approvalStatus="props">
            <q-td :props="props">
              <q-chip
                :color="getApprovalStatusColor(props.row.approvalStatus)"
                text-color="white"
                size="sm"
                dense
                class="status-chip"
              >
                {{ props.row.approvalStatus }}
              </q-chip>
            </q-td>
          </template>

          <!-- Verification Status -->
          <template v-slot:body-cell-verification="props">
            <q-td :props="props">
              <div class="verification-badges">
                <q-badge
                  v-if="props.row.isGSTVerified"
                  color="positive"
                  label="GST"
                  class="verify-badge"
                />
                <q-badge
                  v-if="props.row.isPANVerified"
                  color="positive"
                  label="PAN"
                  class="verify-badge"
                />
                <q-badge
                  v-if="props.row.isAddressVerified"
                  color="positive"
                  label="ADDR"
                  class="verify-badge"
                />
                <q-badge
                  v-if="props.row.isBankDetailsVerified"
                  color="positive"
                  label="BANK"
                  class="verify-badge"
                />
                <span v-if="!hasAnyVerification(props.row)" class="no-verification">-</span>
              </div>
            </q-td>
          </template>

          <!-- Rating -->
          <template v-slot:body-cell-rating="props">
            <q-td :props="props">
              <div class="rating-display">
                <q-rating
                  v-model="props.row.overallRating"
                  size="sm"
                  color="amber"
                  readonly
                  :max="5"
                />
                <span class="rating-text">{{ props.row.overallRating || '0.0' }}</span>
              </div>
            </q-td>
          </template>

          <!-- Vendor Type -->
          <template v-slot:body-cell-vendorType="props">
            <q-td :props="props">
              <q-chip
                :color="getVendorTypeColor(props.row.vendorType)"
                text-color="white"
                size="sm"
                dense
                class="type-chip"
              >
                {{ props.row.vendorType }}
              </q-chip>
            </q-td>
          </template>

          <!-- City -->
          <template v-slot:body-cell-city="props">
            <q-td :props="props">
              <div class="city-info">
                <q-icon name="location_on" size="xs" class="location-icon" />
                <span>{{ props.row.city || '-' }}</span>
              </div>
            </q-td>
          </template>

          <!-- Actions -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="action-buttons-row">
                <q-btn
                  icon="visibility"
                  size="sm"
                  flat
                  round
                  dense
                  color="primary"
                  @click="showVendorDetails(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.approvalStatus === 'Pending'"
                  icon="edit"
                  size="sm"
                  flat
                  round
                  dense
                  color="warning"
                  @click="editVendor(props.row)"
                >
                  <q-tooltip>Edit Vendor</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.approvalStatus === 'Pending'"
                  icon="check"
                  size="sm"
                  flat
                  round
                  dense
                  color="positive"
                  @click="approveVendor(props.row)"
                >
                  <q-tooltip>Approve</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="props.row.approvalStatus === 'Pending'"
                  icon="close"
                  size="sm"
                  flat
                  round
                  dense
                  color="negative"
                  @click="rejectVendor(props.row)"
                >
                  <q-tooltip>Reject</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- Table Footer -->
          <!-- eslint-disable-next-line vue/no-unused-vars -->
          <template v-slot:bottom="props">
            <div class="table-footer">
              <div class="footer-info">
                Showing {{ ((pagination.page - 1) * pagination.rowsPerPage) + 1 }}
                to {{ Math.min(pagination.page * pagination.rowsPerPage, pagination.rowsNumber) }}
                of {{ pagination.rowsNumber }} vendors
              </div>
              <div class="footer-controls">
                <q-pagination
                  v-model="pagination.page"
                  :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                  :max-pages="6"
                  direction-links
                  @update:model-value="onTableRequest({ pagination })"
                />
                <q-select
                  v-model="pagination.rowsPerPage"
                  :options="[25, 50, 100, 200]"
                  label="Per page"
                  dense
                  outlined
                  @update:model-value="onTableRequest({ pagination })"
                  class="rows-select"
                />
              </div>
            </div>
          </template>

          <!-- No Data -->
          <template v-slot:no-data="{ message }">
            <div class="no-data">
              <q-icon size="3em" name="store" color="grey-4" />
              <div class="no-data-text">{{ message }}</div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Bulk Add Vendors Dialog -->
    <q-dialog v-model="showBulkAddDialog" persistent maximized>
      <q-card class="bulk-add-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="add_business" />
          <div class="bar-title">Add Vendors in Bulk</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-stepper
            v-model="currentStep"
            ref="stepper"
            color="primary"
            animated
            class="vendor-stepper"
          >
            <!-- Step 1: Basic Information -->
            <q-step
              :name="1"
              title="Basic Information"
              icon="business"
              :done="currentStep > 1"
              class="step-basic"
            >
              <div class="step-content">
                <div class="step-header">
                  <h6>Company & Business Details</h6>
                  <p>Enter basic information for the vendors you want to create</p>
                </div>

                <div class="form-grid">
                  <div class="form-group full-width">
                    <label class="form-label">Company Names (one per line) *</label>
                    <q-input
                      v-model="bulkAdd.companyNames"
                      type="textarea"
                      rows="6"
                      filled
                      placeholder="Enter company names, one per line:&#10;ABC Construction Ltd&#10;XYZ Steel Works&#10;PQR Electrical Services"
                      :rules="[val => !!val && val.trim() || 'At least one company name is required']"
                    />
                    <div class="form-helper">
                      {{ getCompanyNamesCount() }} company{{ getCompanyNamesCount() !== 1 ? 'ies' : 'y' }} will be created
                    </div>
                  </div>

                  <div class="form-group">
                    <q-select
                      v-model="bulkAdd.vendorType"
                      :options="vendorTypeOptions"
                      label="Vendor Type *"
                      filled
                      dense
                      emit-value
                      map-options
                      :rules="[val => !!val || 'Vendor type is required']"
                    />
                  </div>

                  <div class="form-group">
                    <q-select
                      v-model="bulkAdd.vendorCategory"
                      :options="vendorCategoryOptions"
                      label="Category"
                      filled
                      dense
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="form-group">
                    <q-input
                      v-model="bulkAdd.paymentTerms"
                      label="Payment Terms"
                      filled
                      dense
                      placeholder="e.g., Net 30, Net 45"
                    />
                  </div>

                  <div class="form-group">
                    <q-input
                      v-model.number="bulkAdd.creditLimit"
                      label="Credit Limit"
                      filled
                      dense
                      type="number"
                      prefix="₹"
                    />
                  </div>
                </div>
              </div>
            </q-step>

            <!-- Step 2: Contact Details -->
            <q-step
              :name="2"
              title="Contact Information"
              icon="contacts"
              :done="currentStep > 2"
              class="step-contacts"
            >
              <div class="step-content">
                <div class="step-header">
                  <h6>Contact Details per Company</h6>
                  <p>Specify contact information for each company</p>
                </div>

                <div class="contacts-container">
                  <q-card
                    v-for="(company, index) in getCompanyList()"
                    :key="index"
                    flat
                    bordered
                    class="contact-card"
                  >
                    <q-card-section>
                      <div class="contact-header">
                        <q-icon name="business" color="primary" />
                        <span class="company-title">{{ company }}</span>
                      </div>

                      <div class="contact-form-grid">
                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].vendorCode"
                            label="Vendor Code *"
                            filled
                            dense
                            :rules="[val => !!val || 'Vendor code is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].contactPersonName"
                            label="Contact Person *"
                            filled
                            dense
                            :rules="[val => !!val || 'Contact person is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].email"
                            label="Email *"
                            filled
                            dense
                            type="email"
                            :rules="[
                              val => !!val || 'Email is required',
                              val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
                            ]"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].phone"
                            label="Phone *"
                            filled
                            dense
                            :rules="[val => !!val || 'Phone is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].alternatePhone"
                            label="Alternate Phone"
                            filled
                            dense
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].website"
                            label="Website"
                            filled
                            dense
                            placeholder="https://www.example.com"
                          />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-step>

            <!-- Step 3: Address & Location -->
            <q-step
              :name="3"
              title="Address Information"
              icon="location_on"
              :done="currentStep > 3"
              class="step-address"
            >
              <div class="step-content">
                <div class="step-header">
                  <h6>Address & Location Details</h6>
                  <p>Specify address information for each company</p>
                </div>

                <div class="address-container">
                  <q-card
                    v-for="(company, index) in getCompanyList()"
                    :key="index"
                    flat
                    bordered
                    class="address-card"
                  >
                    <q-card-section>
                      <div class="address-header">
                        <q-icon name="location_on" color="primary" />
                        <span class="company-title">{{ company }}</span>
                      </div>

                      <div class="address-form-grid">
                        <div class="form-group full-width">
                          <q-input
                            v-model="bulkAdd.contacts[index].registeredAddress"
                            label="Registered Address *"
                            filled
                            dense
                            type="textarea"
                            rows="2"
                            :rules="[val => !!val || 'Registered address is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-checkbox
                            v-model="bulkAdd.contacts[index].sameAsBilling"
                            label="Billing address same as registered"
                            @update:model-value="handleSameAddressToggle(index, 'billing')"
                          />
                        </div>

                        <div class="form-group">
                          <q-checkbox
                            v-model="bulkAdd.contacts[index].sameAsDelivery"
                            label="Delivery address same as registered"
                            @update:model-value="handleSameAddressToggle(index, 'delivery')"
                          />
                        </div>

                        <div v-if="!bulkAdd.contacts[index].sameAsBilling" class="form-group full-width">
                          <q-input
                            v-model="bulkAdd.contacts[index].billingAddress"
                            label="Billing Address"
                            filled
                            dense
                            type="textarea"
                            rows="2"
                          />
                        </div>

                        <div v-if="!bulkAdd.contacts[index].sameAsDelivery" class="form-group full-width">
                          <q-input
                            v-model="bulkAdd.contacts[index].deliveryAddress"
                            label="Delivery Address"
                            filled
                            dense
                            type="textarea"
                            rows="2"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].city"
                            label="City *"
                            filled
                            dense
                            :rules="[val => !!val || 'City is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].state"
                            label="State *"
                            filled
                            dense
                            :rules="[val => !!val || 'State is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].pinCode"
                            label="Pin Code *"
                            filled
                            dense
                            :rules="[val => !!val || 'Pin code is required']"
                          />
                        </div>

                        <div class="form-group">
                          <q-input
                            v-model="bulkAdd.contacts[index].country"
                            label="Country"
                            filled
                            dense
                            readonly
                            :model-value="'India'"
                          />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-step>

            <!-- Step 4: Business Information -->
            <q-step
              :name="4"
              title="Business Details"
              icon="description"
              :done="currentStep > 4"
              class="step-business"
            >
              <div class="step-content">
                <div class="step-header">
                  <h6>Business Registration & Banking</h6>
                  <p>Enter business registration and banking details</p>
                </div>

                <div class="business-container">
                  <q-card
                    v-for="(company, index) in getCompanyList()"
                    :key="index"
                    flat
                    bordered
                    class="business-card"
                  >
                    <q-card-section>
                      <div class="business-header">
                        <q-icon name="description" color="primary" />
                        <span class="company-title">{{ company }}</span>
                      </div>

                      <div class="business-tabs">
                        <q-tabs v-model="businessTab[index]" class="text-primary">
                          <q-tab name="registration" label="Registration" />
                          <q-tab name="banking" label="Banking" />
                        </q-tabs>

                        <q-tab-panels v-model="businessTab[index]" animated>
                          <q-tab-panel name="registration">
                            <div class="business-form-grid">
                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].gstNumber"
                                  label="GST Number"
                                  filled
                                  dense
                                  placeholder="22AAAAA0000A1Z5"
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].panNumber"
                                  label="PAN Number"
                                  filled
                                  dense
                                  placeholder="AAAAA0000A"
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].licenseNumber"
                                  label="License Number"
                                  filled
                                  dense
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].registrationNumber"
                                  label="Registration Number"
                                  filled
                                  dense
                                />
                              </div>

                              <div class="form-group full-width">
                                <q-input
                                  v-model="bulkAdd.contacts[index].specialization"
                                  label="Specialization"
                                  filled
                                  dense
                                  placeholder="Key products/services offered"
                                />
                              </div>
                            </div>
                          </q-tab-panel>

                          <q-tab-panel name="banking">
                            <div class="business-form-grid">
                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].bankName"
                                  label="Bank Name"
                                  filled
                                  dense
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].bankAccountNumber"
                                  label="Account Number"
                                  filled
                                  dense
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].ifscCode"
                                  label="IFSC Code"
                                  filled
                                  dense
                                  placeholder="ABCD0123456"
                                />
                              </div>

                              <div class="form-group">
                                <q-input
                                  v-model="bulkAdd.contacts[index].bankBranch"
                                  label="Bank Branch"
                                  filled
                                  dense
                                />
                              </div>
                            </div>
                          </q-tab-panel>
                        </q-tab-panels>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-step>

            <!-- Navigation -->
            <template v-slot:navigation>
              <q-stepper-navigation class="stepper-nav">
                <div class="nav-actions">
                  <q-btn
                    v-if="currentStep < 4"
                    @click="$refs.stepper.next()"
                    color="primary"
                    label="Continue"
                    :disable="!canProceed"
                  />
                  <q-btn
                    v-if="currentStep === 4"
                    @click="executeBulkAdd"
                    color="positive"
                    label="Create Vendors"
                    :loading="isCreating"
                    :disable="!canCreateVendors"
                  />
                  <q-btn
                    v-if="currentStep > 1"
                    flat
                    color="primary"
                    @click="$refs.stepper.previous()"
                    label="Back"
                  />
                  <q-btn
                    flat
                    label="Cancel"
                    @click="cancelBulkAdd"
                  />
                </div>
              </q-stepper-navigation>
            </template>
          </q-stepper>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit Vendor Dialog -->
    <q-dialog v-model="showEditDialog" persistent maximized>
      <q-card class="edit-vendor-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="edit" />
          <div class="bar-title">Edit Vendor - {{ editForm.companyName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content">
          <q-form @submit="saveVendorChanges" class="edit-form">
            <q-tabs v-model="editTab" class="text-primary edit-tabs">
              <q-tab name="basic" label="Basic Info" icon="business" />
              <q-tab name="contact" label="Contact" icon="contact_phone" />
              <q-tab name="address" label="Address" icon="location_on" />
              <q-tab name="business" label="Business" icon="description" />
              <q-tab name="banking" label="Banking" icon="account_balance" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="editTab" animated class="edit-panels">
              <!-- Basic Information -->
              <q-tab-panel name="basic">
                <div class="panel-content">
                  <h6 class="panel-title">Company Information</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.companyName"
                        label="Company Name *"
                        filled
                        dense
                        :rules="[val => !!val || 'Company name is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.vendorCode"
                        label="Vendor Code *"
                        filled
                        dense
                        :rules="[val => !!val || 'Vendor code is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="editForm.vendorType"
                        :options="vendorTypeOptions"
                        label="Vendor Type *"
                        filled
                        dense
                        emit-value
                        map-options
                        :rules="[val => !!val || 'Vendor type is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-select
                        v-model="editForm.vendorCategory"
                        :options="vendorCategoryOptions"
                        label="Category"
                        filled
                        dense
                        emit-value
                        map-options
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.paymentTerms"
                        label="Payment Terms"
                        filled
                        dense
                        placeholder="e.g., Net 30, Net 45"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model.number="editForm.creditLimit"
                        label="Credit Limit"
                        filled
                        dense
                        type="number"
                        prefix="₹"
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.specialization"
                        label="Specialization"
                        filled
                        dense
                        placeholder="Key products/services offered"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Contact Information -->
              <q-tab-panel name="contact">
                <div class="panel-content">
                  <h6 class="panel-title">Contact Details</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.contactPersonName"
                        label="Contact Person *"
                        filled
                        dense
                        :rules="[val => !!val || 'Contact person is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.email"
                        label="Email *"
                        filled
                        dense
                        type="email"
                        :rules="[
                          val => !!val || 'Email is required',
                          val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
                        ]"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.phone"
                        label="Phone *"
                        filled
                        dense
                        :rules="[val => !!val || 'Phone is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.alternatePhone"
                        label="Alternate Phone"
                        filled
                        dense
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.website"
                        label="Website"
                        filled
                        dense
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Address Information -->
              <q-tab-panel name="address">
                <div class="panel-content">
                  <h6 class="panel-title">Address Information</h6>
                  <div class="form-grid">
                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.registeredAddress"
                        label="Registered Address *"
                        filled
                        dense
                        type="textarea"
                        rows="2"
                        :rules="[val => !!val || 'Registered address is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.sameAsBilling"
                        label="Billing address same as registered"
                        @update:model-value="handleEditSameAddressToggle('billing')"
                      />
                    </div>

                    <div class="form-group">
                      <q-checkbox
                        v-model="editForm.sameAsDelivery"
                        label="Delivery address same as registered"
                        @update:model-value="handleEditSameAddressToggle('delivery')"
                      />
                    </div>

                    <div v-if="!editForm.sameAsBilling" class="form-group full-width">
                      <q-input
                        v-model="editForm.billingAddress"
                        label="Billing Address"
                        filled
                        dense
                        type="textarea"
                        rows="2"
                      />
                    </div>

                    <div v-if="!editForm.sameAsDelivery" class="form-group full-width">
                      <q-input
                        v-model="editForm.deliveryAddress"
                        label="Delivery Address"
                        filled
                        dense
                        type="textarea"
                        rows="2"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.city"
                        label="City *"
                        filled
                        dense
                        :rules="[val => !!val || 'City is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.state"
                        label="State *"
                        filled
                        dense
                        :rules="[val => !!val || 'State is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.pinCode"
                        label="Pin Code *"
                        filled
                        dense
                        :rules="[val => !!val || 'Pin code is required']"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.country"
                        label="Country"
                        filled
                        dense
                        readonly
                        :model-value="'India'"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Business Information -->
              <q-tab-panel name="business">
                <div class="panel-content">
                  <h6 class="panel-title">Business Registration</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.gstNumber"
                        label="GST Number"
                        filled
                        dense
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.panNumber"
                        label="PAN Number"
                        filled
                        dense
                        placeholder="AAAAA0000A"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.licenseNumber"
                        label="License Number"
                        filled
                        dense
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.registrationNumber"
                        label="Registration Number"
                        filled
                        dense
                      />
                    </div>

                    <div class="form-group full-width">
                      <q-input
                        v-model="editForm.deliveryTerms"
                        label="Delivery Terms"
                        filled
                        dense
                        placeholder="Delivery terms and conditions"
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Banking Information -->
              <q-tab-panel name="banking">
                <div class="panel-content">
                  <h6 class="panel-title">Banking Details</h6>
                  <div class="form-grid">
                    <div class="form-group">
                      <q-input
                        v-model="editForm.bankName"
                        label="Bank Name"
                        filled
                        dense
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.bankAccountNumber"
                        label="Account Number"
                        filled
                        dense
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.ifscCode"
                        label="IFSC Code"
                        filled
                        dense
                        placeholder="ABCD0123456"
                      />
                    </div>

                    <div class="form-group">
                      <q-input
                        v-model="editForm.bankBranch"
                        label="Bank Branch"
                        filled
                        dense
                      />
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>

            <q-separator />

            <div class="form-actions">
              <q-btn
                type="submit"
                color="primary"
                label="Save Changes"
                :loading="isSaving"
                icon="save"
              />
              <q-btn
                flat
                label="Cancel"
                @click="cancelEdit"
                :disable="isSaving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Vendor Details Modal -->
    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card class="vendor-details-dialog">
        <q-bar class="dialog-bar">
          <q-icon name="store" />
          <div class="bar-title">{{ selectedVendor?.companyName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="dialog-content" v-if="selectedVendor">
          <q-tabs v-model="detailsTab" class="text-primary">
            <q-tab name="overview" label="Overview" icon="info" />
            <q-tab name="contact" label="Contact" icon="contact_phone" />
            <q-tab name="business" label="Business" icon="business_center" />
            <q-tab name="verification" label="Verification" icon="verified" />
          </q-tabs>

          <q-tab-panels v-model="detailsTab" animated class="details-panels">
            <q-tab-panel name="overview">
              <div class="overview-content">
                <div class="overview-stats">
                  <div class="stat-card">
                    <q-icon name="star" color="amber" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedVendor.overallRating || '0.0' }}</div>
                      <div class="stat-label">Overall Rating</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="shopping_cart" color="primary" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedVendor.totalOrders || 0 }}</div>
                      <div class="stat-label">Total Orders</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <q-icon name="check_circle" color="positive" size="md" />
                    <div class="stat-info">
                      <div class="stat-value">{{ selectedVendor.completedOrders || 0 }}</div>
                      <div class="stat-label">Completed</div>
                    </div>
                  </div>
                </div>

                <div class="overview-details">
                  <div class="detail-group">
                    <label>Vendor Type:</label>
                    <q-chip :color="getVendorTypeColor(selectedVendor.vendorType)" text-color="white" size="sm">
                      {{ selectedVendor.vendorType }}
                    </q-chip>
                  </div>

                  <div class="detail-group">
                    <label>Category:</label>
                    <span>{{ selectedVendor.vendorCategory || '-' }}</span>
                  </div>

                  <div class="detail-group">
                    <label>Status:</label>
                    <q-chip :color="getVendorStatusColor(selectedVendor.vendorStatus)" text-color="white" size="sm">
                      {{ selectedVendor.vendorStatus }}
                    </q-chip>
                  </div>

                  <div class="detail-group">
                    <label>Approval Status:</label>
                    <q-chip :color="getApprovalStatusColor(selectedVendor.approvalStatus)" text-color="white" size="sm">
                      {{ selectedVendor.approvalStatus }}
                    </q-chip>
                  </div>

                  <div v-if="selectedVendor.specialization" class="detail-group full-width">
                    <label>Specialization:</label>
                    <span>{{ selectedVendor.specialization }}</span>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="contact">
              <div class="contact-content">
                <div class="contact-section">
                  <h6>Primary Contact</h6>
                  <div class="contact-details">
                    <div class="detail-row">
                      <q-icon name="person" />
                      <span>{{ selectedVendor.contactPersonName || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <q-icon name="email" />
                      <span>{{ selectedVendor.email || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <q-icon name="phone" />
                      <span>{{ selectedVendor.phone || '-' }}</span>
                    </div>
                    <div v-if="selectedVendor.alternatePhone" class="detail-row">
                      <q-icon name="phone" />
                      <span>{{ selectedVendor.alternatePhone }}</span>
                    </div>
                    <div v-if="selectedVendor.website" class="detail-row">
                      <q-icon name="language" />
                      <a :href="selectedVendor.website" target="_blank" class="website-link">
                        {{ selectedVendor.website }}
                      </a>
                    </div>
                  </div>
                </div>

                <div class="address-section">
                  <h6>Addresses</h6>
                  <div class="address-details">
                    <div v-if="selectedVendor.registeredAddress" class="address-block">
                      <label>Registered Address:</label>
                      <p>{{ selectedVendor.registeredAddress }}</p>
                      <p>{{ selectedVendor.city }}, {{ selectedVendor.state }} - {{ selectedVendor.pinCode }}</p>
                    </div>
                    <div v-if="selectedVendor.billingAddress && selectedVendor.billingAddress !== selectedVendor.registeredAddress" class="address-block">
                      <label>Billing Address:</label>
                      <p>{{ selectedVendor.billingAddress }}</p>
                    </div>
                    <div v-if="selectedVendor.deliveryAddress && selectedVendor.deliveryAddress !== selectedVendor.registeredAddress" class="address-block">
                      <label>Delivery Address:</label>
                      <p>{{ selectedVendor.deliveryAddress }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="business">
              <div class="business-content">
                <div class="business-section">
                  <h6>Registration Details</h6>
                  <div class="business-details">
                    <div class="detail-row">
                      <label>GST Number:</label>
                      <span>{{ selectedVendor.gstNumber || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>PAN Number:</label>
                      <span>{{ selectedVendor.panNumber || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>License Number:</label>
                      <span>{{ selectedVendor.licenseNumber || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Registration Number:</label>
                      <span>{{ selectedVendor.registrationNumber || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="banking-section">
                  <h6>Banking Information</h6>
                  <div class="banking-details">
                    <div class="detail-row">
                      <label>Bank Name:</label>
                      <span>{{ selectedVendor.bankName || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Account Number:</label>
                      <span>{{ selectedVendor.bankAccountNumber || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>IFSC Code:</label>
                      <span>{{ selectedVendor.ifscCode || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Branch:</label>
                      <span>{{ selectedVendor.bankBranch || '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="terms-section">
                  <h6>Business Terms</h6>
                  <div class="terms-details">
                    <div class="detail-row">
                      <label>Payment Terms:</label>
                      <span>{{ selectedVendor.paymentTerms || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Credit Limit:</label>
                      <span>{{ selectedVendor.creditLimit ? `₹${formatCurrency(selectedVendor.creditLimit)}` : '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <label>Delivery Terms:</label>
                      <span>{{ selectedVendor.deliveryTerms || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </q-tab-panel>

            <q-tab-panel name="verification">
              <div class="verification-content">
                <div class="verification-section">
                  <h6>Verification Status</h6>
                  <div class="verification-grid">
                    <div class="verification-item">
                      <q-icon
                        :name="selectedVendor.isGSTVerified ? 'check_circle' : 'radio_button_unchecked'"
                        :color="selectedVendor.isGSTVerified ? 'positive' : 'grey'"
                        size="md"
                      />
                      <div class="verification-info">
                        <div class="verification-label">GST Verified</div>
                        <div class="verification-status">{{ selectedVendor.isGSTVerified ? 'Verified' : 'Pending' }}</div>
                      </div>
                    </div>

                    <div class="verification-item">
                      <q-icon
                        :name="selectedVendor.isPANVerified ? 'check_circle' : 'radio_button_unchecked'"
                        :color="selectedVendor.isPANVerified ? 'positive' : 'grey'"
                        size="md"
                      />
                      <div class="verification-info">
                        <div class="verification-label">PAN Verified</div>
                        <div class="verification-status">{{ selectedVendor.isPANVerified ? 'Verified' : 'Pending' }}</div>
                      </div>
                    </div>

                    <div class="verification-item">
                      <q-icon
                        :name="selectedVendor.isAddressVerified ? 'check_circle' : 'radio_button_unchecked'"
                        :color="selectedVendor.isAddressVerified ? 'positive' : 'grey'"
                        size="md"
                      />
                      <div class="verification-info">
                        <div class="verification-label">Address Verified</div>
                        <div class="verification-status">{{ selectedVendor.isAddressVerified ? 'Verified' : 'Pending' }}</div>
                      </div>
                    </div>

                    <div class="verification-item">
                      <q-icon
                        :name="selectedVendor.isBankDetailsVerified ? 'check_circle' : 'radio_button_unchecked'"
                        :color="selectedVendor.isBankDetailsVerified ? 'positive' : 'grey'"
                        size="md"
                      />
                      <div class="verification-info">
                        <div class="verification-label">Bank Details Verified</div>
                        <div class="verification-status">{{ selectedVendor.isBankDetailsVerified ? 'Verified' : 'Pending' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedVendor.approvalStatus === 'Pending'" class="approval-actions">
                  <h6>Approval Actions</h6>
                  <div class="action-buttons">
                    <q-btn
                      color="positive"
                      icon="check"
                      label="Approve Vendor"
                      @click="approveVendor(selectedVendor)"
                    />
                    <q-btn
                      color="negative"
                      icon="close"
                      label="Reject Vendor"
                      outline
                      @click="rejectVendor(selectedVendor)"
                    />
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useVendorsStore } from 'stores/vendors'
import { showSuccess, showError } from 'src/utils/notification'
import SearchChips from 'src/components/SearchChips.vue'

export default {
  name: 'VendorManagement',

  components: {
    SearchChips
  },

  setup() {
    const $q = useQuasar()
    const vendorsStore = useVendorsStore()

    // Reactive data
    const isLoading = ref(false)
    const isCreating = ref(false)
    const isSaving = ref(false)
    const vendors = ref([])
    const selectedVendors = ref([])
    const currentKeywords = ref([])

    // Filters
    const filters = ref({
      vendorType: null,
      vendorCategory: null,
      vendorStatus: null,
      approvalStatus: null,
      city: '',
      minRating: null
    })

    // Dialogs
    const showBulkAddDialog = ref(false)
    const showEditDialog = ref(false)
    const showDetailsDialog = ref(false)
    const selectedVendor = ref(null)

    // Tabs
    const currentStep = ref(1)
    const detailsTab = ref('overview')
    const editTab = ref('basic')

    // Bulk add form
    const bulkAdd = ref({
      companyNames: '',
      vendorType: null,
      vendorCategory: null,
      paymentTerms: '',
      creditLimit: null,
      contacts: []
    })

    // Edit form
    const editForm = ref({})
    const editVendorId = ref(null)

    // Business tabs for each company
    const businessTab = ref({})

    // Table configuration
    const pagination = ref({
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
      sortBy: 'companyName',
      descending: false
    })

    const columns = [
      {
        name: 'companyName',
        required: true,
        label: 'Company Name',
        align: 'left',
        field: 'companyName',
        sortable: true,
        style: 'min-width: 200px'
      },
      {
        name: 'contact',
        align: 'left',
        label: 'Contact',
        field: 'contactPersonName',
        sortable: true,
        style: 'min-width: 180px'
      },
      {
        name: 'approvalStatus',
        align: 'center',
        label: 'Approval',
        field: 'approvalStatus',
        sortable: true
      },
      {
        name: 'verification',
        align: 'center',
        label: 'Verification',
        field: 'verification',
        sortable: false
      },
      {
        name: 'rating',
        align: 'center',
        label: 'Rating',
        field: 'overallRating',
        sortable: true
      },
      {
        name: 'vendorType',
        align: 'center',
        label: 'Type',
        field: 'vendorType',
        sortable: true
      },
      {
        name: 'city',
        align: 'left',
        label: 'City',
        field: 'city',
        sortable: true
      },
      {
        name: 'actions',
        align: 'center',
        label: 'Actions',
        field: 'actions',
        sortable: false
      }
    ]

    // Options
    const vendorTypeOptions = [
      { label: 'Supplier', value: 'Supplier' },
      { label: 'Contractor', value: 'Contractor' },
      { label: 'Manufacturer', value: 'Manufacturer' },
      { label: 'Trader', value: 'Trader' }
    ]

    const vendorCategoryOptions = [
      { label: 'Electrical', value: 'Electrical' },
      { label: 'Plumbing', value: 'Plumbing' },
      { label: 'Civil', value: 'Civil' },
      { label: 'Steel', value: 'Steel' },
      { label: 'Cement', value: 'Cement' },
      { label: 'Tiles', value: 'Tiles' },
      { label: 'Paints', value: 'Paints' },
      { label: 'Hardware', value: 'Hardware' },
      { label: 'Glass', value: 'Glass' },
      { label: 'Security', value: 'Security' }
    ]

    const vendorStatusOptions = [
      { label: 'Provisional', value: 'Provisional' },
      { label: 'Approved', value: 'Approved' },
      { label: 'Suspended', value: 'Suspended' },
      { label: 'Blocked', value: 'Blocked' }
    ]

    const approvalStatusOptions = [
      { label: 'Pending', value: 'Pending' },
      { label: 'Approved', value: 'Approved' },
      { label: 'Rejected', value: 'Rejected' }
    ]

    const ratingOptions = [
      { label: '4+ Stars', value: 4.0 },
      { label: '3+ Stars', value: 3.0 },
      { label: '2+ Stars', value: 2.0 },
      { label: '1+ Stars', value: 1.0 }
    ]

    // Computed properties
    const canProceed = computed(() => {
      if (currentStep.value === 1) {
        return bulkAdd.value.companyNames.trim() && bulkAdd.value.vendorType
      }
      if (currentStep.value === 2) {
        return validateContactsStep()
      }
      if (currentStep.value === 3) {
        return validateAddressStep()
      }
      return true
    })

    const canCreateVendors = computed(() => {
      return validateAllSteps()
    })

    // Utility functions
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0'
      return new Intl.NumberFormat('en-IN').format(amount)
    }

    const getCompanyNamesCount = () => {
      if (!bulkAdd.value.companyNames) return 0
      return bulkAdd.value.companyNames.trim().split('\n').filter(name => name.trim()).length
    }

    const getCompanyList = () => {
      if (!bulkAdd.value.companyNames) return []
      const companies = bulkAdd.value.companyNames.trim().split('\n').filter(name => name.trim())

      // Initialize contacts array if not exists or length mismatch
      if (!bulkAdd.value.contacts || bulkAdd.value.contacts.length !== companies.length) {
        // eslint-disable-next-line no-unused-vars
        bulkAdd.value.contacts = companies.map((company, index) => ({
          vendorCode: '',
          contactPersonName: '',
          email: '',
          phone: '',
          alternatePhone: '',
          website: '',
          registeredAddress: '',
          billingAddress: '',
          deliveryAddress: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
          gstNumber: '',
          panNumber: '',
          licenseNumber: '',
          registrationNumber: '',
          specialization: '',
          bankName: '',
          bankAccountNumber: '',
          ifscCode: '',
          bankBranch: '',
          sameAsBilling: false,
          sameAsDelivery: false
        }))

        // Initialize business tabs
        companies.forEach((_, index) => {
          if (!businessTab.value[index]) {
            businessTab.value[index] = 'registration'
          }
        })
      }

      return companies
    }

    // Search and filter functions
    const handleSearch = async (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      await loadVendors(keywords)
    }

    const handleChipsUpdated = (keywords) => {
      currentKeywords.value = [...keywords]
      pagination.value.page = 1
      loadVendors(keywords)
    }

    const applyFilters = () => {
      pagination.value.page = 1
      loadVendors(currentKeywords.value)
    }

    // Data loading functions
    const loadVendors = async (keywords = []) => {
      isLoading.value = true
      try {
        const params = {
          page: pagination.value.page - 1,
          size: pagination.value.rowsPerPage,
          sort: pagination.value.sortBy,
          direction: pagination.value.descending ? 'DESC' : 'ASC'
        }

        let response
        if (keywords.length > 0 || hasActiveFilters()) {
          // Use search with filters
          const searchTerm = keywords.join(' ')
          response = await vendorsStore.searchVendors(
            searchTerm,
            filters.value.vendorType,
            filters.value.vendorCategory,
            filters.value.vendorStatus,
            filters.value.approvalStatus,
            filters.value.city,
            null, // state
            params
          )
        } else {
          // Regular fetch
          response = await vendorsStore.fetchVendors(
            filters.value.vendorStatus,
            filters.value.approvalStatus,
            params
          )
        }

        if (response && response.success) {
          vendors.value = response.data.content || response.data
          pagination.value.rowsNumber = response.data.totalElements || vendors.value.length
        }
      } catch (error) {
        showError('Failed to load vendors')
        console.error(error)
      } finally {
        isLoading.value = false
      }
    }

    const hasActiveFilters = () => {
      return !!(filters.value.vendorType ||
                filters.value.vendorCategory ||
                filters.value.vendorStatus ||
                filters.value.approvalStatus ||
                filters.value.city ||
                filters.value.minRating)
    }

    // Table functions
    const onTableRequest = (props) => {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
      pagination.value.sortBy = props.pagination.sortBy
      pagination.value.descending = props.pagination.descending
      pagination.value.rowsNumber = props.pagination.rowsNumber

      loadVendors(currentKeywords.value)
    }

    const clearSelection = () => {
      selectedVendors.value = []
    }

    // Vendor display functions
    const hasAnyVerification = (vendor) => {
      return vendor.isGSTVerified || vendor.isPANVerified || vendor.isAddressVerified || vendor.isBankDetailsVerified
    }

    const getVendorStatusColor = (status) => {
      return vendorsStore.getVendorStatusColor(status)
    }

    const getApprovalStatusColor = (status) => {
      return vendorsStore.getApprovalStatusColor(status)
    }

    const getVendorTypeColor = (type) => {
      const colorMap = {
        'Supplier': 'primary',
        'Contractor': 'secondary',
        'Manufacturer': 'accent',
        'Trader': 'info'
      }
      return colorMap[type] || 'grey'
    }

    // Bulk add functions
    const validateContactsStep = () => {
      return bulkAdd.value.contacts.every(contact =>
        contact.vendorCode && contact.contactPersonName && contact.email && contact.phone
      )
    }

    const validateAddressStep = () => {
      return bulkAdd.value.contacts.every(contact =>
        contact.registeredAddress && contact.city && contact.state && contact.pinCode
      )
    }

    const validateAllSteps = () => {
      return bulkAdd.value.companyNames.trim() &&
             bulkAdd.value.vendorType &&
             validateContactsStep() &&
             validateAddressStep()
    }

    const handleSameAddressToggle = (index, type) => {
      const contact = bulkAdd.value.contacts[index]
      if (type === 'billing' && contact.sameAsBilling) {
        contact.billingAddress = contact.registeredAddress
      }
      if (type === 'delivery' && contact.sameAsDelivery) {
        contact.deliveryAddress = contact.registeredAddress
      }
    }

    const handleEditSameAddressToggle = (type) => {
      if (type === 'billing' && editForm.value.sameAsBilling) {
        editForm.value.billingAddress = editForm.value.registeredAddress
      }
      if (type === 'delivery' && editForm.value.sameAsDelivery) {
        editForm.value.deliveryAddress = editForm.value.registeredAddress
      }
    }

    const executeBulkAdd = async () => {
      if (!canCreateVendors.value) return

      isCreating.value = true
      try {
        const companies = getCompanyList()
        const vendorsToCreate = companies.map((companyName, index) => {
          const contact = bulkAdd.value.contacts[index]

          return {
            recCode: generateUUID(),
            vendorCode: contact.vendorCode,
            companyName: companyName.trim(),
            vendorType: bulkAdd.value.vendorType,
            vendorCategory: bulkAdd.value.vendorCategory,
            contactPersonName: contact.contactPersonName,
            email: contact.email,
            phone: contact.phone,
            alternatePhone: contact.alternatePhone || null,
            website: contact.website || null,
            registeredAddress: contact.registeredAddress,
            billingAddress: contact.sameAsBilling ? contact.registeredAddress : (contact.billingAddress || contact.registeredAddress),
            deliveryAddress: contact.sameAsDelivery ? contact.registeredAddress : (contact.deliveryAddress || contact.registeredAddress),
            city: contact.city,
            state: contact.state,
            country: contact.country,
            pinCode: contact.pinCode,
            gstNumber: contact.gstNumber || null,
            panNumber: contact.panNumber || null,
            licenseNumber: contact.licenseNumber || null,
            registrationNumber: contact.registrationNumber || null,
            specialization: contact.specialization || null,
            bankName: contact.bankName || null,
            bankAccountNumber: contact.bankAccountNumber || null,
            ifscCode: contact.ifscCode || null,
            bankBranch: contact.bankBranch || null,
            paymentTerms: bulkAdd.value.paymentTerms || null,
            creditLimit: bulkAdd.value.creditLimit || 0,
            vendorStatus: 'Provisional',
            approvalStatus: 'Pending',
            overallRating: 0.0,
            totalOrders: 0,
            completedOrders: 0,
            onTimeDeliveries: 0,
            qualityIssues: 0,
            isGSTVerified: false,
            isPANVerified: false,
            isAddressVerified: false,
            isBankDetailsVerified: false,
            isPreferredVendor: false,
            onboardingSource: 'Bulk Creation'
          }
        })

        console.log('Vendors to create:', vendorsToCreate)

        const response = await vendorsStore.bulkCreateVendors(vendorsToCreate)

        if (response && response.success) {
          showSuccess(`Successfully created ${vendorsToCreate.length} vendors`)
          showBulkAddDialog.value = false
          resetBulkAddForm()
          clearSelection()
          await loadVendors(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to create vendors')
        console.error(error)
      } finally {
        isCreating.value = false
      }
    }

    const cancelBulkAdd = () => {
      showBulkAddDialog.value = false
      resetBulkAddForm()
    }

    const resetBulkAddForm = () => {
      bulkAdd.value = {
        companyNames: '',
        vendorType: null,
        vendorCategory: null,
        paymentTerms: '',
        creditLimit: null,
        contacts: []
      }
      currentStep.value = 1
      businessTab.value = {}
    }

    // Edit vendor functions
    const editVendor = (vendor) => {
      editVendorId.value = vendor.recCode
      editForm.value = {
        companyName: vendor.companyName,
        vendorCode: vendor.vendorCode,
        vendorType: vendor.vendorType,
        vendorCategory: vendor.vendorCategory,
        contactPersonName: vendor.contactPersonName,
        email: vendor.email,
        phone: vendor.phone,
        alternatePhone: vendor.alternatePhone || '',
        website: vendor.website || '',
        registeredAddress: vendor.registeredAddress,
        billingAddress: vendor.billingAddress || vendor.registeredAddress,
        deliveryAddress: vendor.deliveryAddress || vendor.registeredAddress,
        city: vendor.city,
        state: vendor.state,
        pinCode: vendor.pinCode,
        country: vendor.country || 'India',
        gstNumber: vendor.gstNumber || '',
        panNumber: vendor.panNumber || '',
        licenseNumber: vendor.licenseNumber || '',
        registrationNumber: vendor.registrationNumber || '',
        specialization: vendor.specialization || '',
        bankName: vendor.bankName || '',
        bankAccountNumber: vendor.bankAccountNumber || '',
        ifscCode: vendor.ifscCode || '',
        bankBranch: vendor.bankBranch || '',
        paymentTerms: vendor.paymentTerms || '',
        creditLimit: vendor.creditLimit || 0,
        deliveryTerms: vendor.deliveryTerms || '',
        sameAsBilling: vendor.billingAddress === vendor.registeredAddress,
        sameAsDelivery: vendor.deliveryAddress === vendor.registeredAddress
      }
      editTab.value = 'basic'
      showEditDialog.value = true
    }

    const saveVendorChanges = async () => {
      if (!editVendorId.value) return

      isSaving.value = true
      try {
        const updateData = {
          companyName: editForm.value.companyName,
          vendorCode: editForm.value.vendorCode,
          vendorType: editForm.value.vendorType,
          vendorCategory: editForm.value.vendorCategory,
          contactPersonName: editForm.value.contactPersonName,
          email: editForm.value.email,
          phone: editForm.value.phone,
          alternatePhone: editForm.value.alternatePhone || null,
          website: editForm.value.website || null,
          registeredAddress: editForm.value.registeredAddress,
          billingAddress: editForm.value.sameAsBilling ? editForm.value.registeredAddress : editForm.value.billingAddress,
          deliveryAddress: editForm.value.sameAsDelivery ? editForm.value.registeredAddress : editForm.value.deliveryAddress,
          city: editForm.value.city,
          state: editForm.value.state,
          pinCode: editForm.value.pinCode,
          country: editForm.value.country,
          gstNumber: editForm.value.gstNumber || null,
          panNumber: editForm.value.panNumber || null,
          licenseNumber: editForm.value.licenseNumber || null,
          registrationNumber: editForm.value.registrationNumber || null,
          specialization: editForm.value.specialization || null,
          bankName: editForm.value.bankName || null,
          bankAccountNumber: editForm.value.bankAccountNumber || null,
          ifscCode: editForm.value.ifscCode || null,
          bankBranch: editForm.value.bankBranch || null,
          paymentTerms: editForm.value.paymentTerms || null,
          creditLimit: editForm.value.creditLimit || 0,
          deliveryTerms: editForm.value.deliveryTerms || null
        }

        const response = await vendorsStore.updateVendor(editVendorId.value, updateData)

        if (response && response.success) {
          showSuccess('Vendor updated successfully')
          showEditDialog.value = false
          resetEditForm()
          await loadVendors(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to update vendor')
        console.error(error)
      } finally {
        isSaving.value = false
      }
    }

    const cancelEdit = () => {
      showEditDialog.value = false
      resetEditForm()
    }

    const resetEditForm = () => {
      editForm.value = {}
      editVendorId.value = null
    }

    // Vendor actions
    const showVendorDetails = (vendor) => {
      selectedVendor.value = vendor
      detailsTab.value = 'overview'
      showDetailsDialog.value = true
    }

    const approveVendor = async (vendor) => {
      try {
        await vendorsStore.processApproval(vendor.recCode, 'approve', 'Approved via management interface')
        showSuccess(`Vendor ${vendor.companyName} approved successfully`)
        await loadVendors(currentKeywords.value)
        if (showDetailsDialog.value) {
          selectedVendor.value.approvalStatus = 'Approved'
          selectedVendor.value.vendorStatus = 'Active'
        }
      } catch (error) {
        showError('Failed to approve vendor')
        console.error(error)
      }
    }

    const rejectVendor = async (vendor) => {
      const reason = await new Promise(resolve => {
        $q.dialog({
          title: 'Reject Vendor',
          message: `Please provide a reason for rejecting ${vendor.companyName}:`,
          prompt: {
            model: '',
            type: 'text'
          },
          cancel: true,
          persistent: true
        }).onOk(data => {
          resolve(data)
        }).onCancel(() => {
          resolve(null)
        })
      })

      if (reason) {
        try {
          await vendorsStore.processApproval(vendor.recCode, 'reject', reason)
          showSuccess(`Vendor ${vendor.companyName} rejected`)
          await loadVendors(currentKeywords.value)
          if (showDetailsDialog.value) {
            selectedVendor.value.approvalStatus = 'Rejected'
            selectedVendor.value.rejectionReason = reason
          }
        } catch (error) {
          showError('Failed to reject vendor')
          console.error(error)
        }
      }
    }

    const confirmBulkApprove = () => {
      if (selectedVendors.value.length === 0) return

      const pendingVendors = selectedVendors.value.filter(v => v.approvalStatus === 'Pending')
      if (pendingVendors.length === 0) {
        showError('No pending vendors selected for approval')
        return
      }

      $q.dialog({
        title: 'Bulk Approve Vendors',
        message: `Are you sure you want to approve ${pendingVendors.length} vendor(s)?`,
        cancel: true,
        persistent: true,
        color: 'positive'
      }).onOk(async () => {
        try {
          const vendorIds = pendingVendors.map(v => v.recCode)
          await vendorsStore.bulkProcessApprovals(vendorIds, 'approve', 'Bulk approved via management interface')
          showSuccess(`Successfully approved ${pendingVendors.length} vendors`)
          clearSelection()
          await loadVendors(currentKeywords.value)
        } catch (error) {
          showError('Failed to bulk approve vendors')
          console.error(error)
        }
      })
    }

    // Lifecycle
    onMounted(async () => {
      await loadVendors()
    })

    // Watchers
    watch(() => filters.value, () => {
      applyFilters()
    }, { deep: true })

    return {
      // State
      isLoading,
      isCreating,
      isSaving,
      vendors,
      selectedVendors,
      currentKeywords,
      filters,

      // Dialogs
      showBulkAddDialog,
      showEditDialog,
      showDetailsDialog,
      selectedVendor,
      currentStep,
      detailsTab,
      editTab,

      // Forms
      bulkAdd,
      editForm,
      businessTab,

      // Table
      pagination,
      columns,

      // Options
      vendorTypeOptions,
      vendorCategoryOptions,
      vendorStatusOptions,
      approvalStatusOptions,
      ratingOptions,

      // Computed
      canProceed,
      canCreateVendors,

      // Methods
      loadVendors,
      onTableRequest,
      clearSelection,
      handleSearch,
      handleChipsUpdated,
      applyFilters,

      // Display
      hasAnyVerification,
      getVendorStatusColor,
      getApprovalStatusColor,
      getVendorTypeColor,
      formatCurrency,

      // Bulk add
      getCompanyNamesCount,
      getCompanyList,
      validateContactsStep,
      validateAddressStep,
      validateAllSteps,
      handleSameAddressToggle,
      handleEditSameAddressToggle,
      executeBulkAdd,
      cancelBulkAdd,
      resetBulkAddForm,

      // Edit vendor
      editVendor,
      saveVendorChanges,
      cancelEdit,
      resetEditForm,

      // Vendor actions
      showVendorDetails,
      approveVendor,
      rejectVendor,
      confirmBulkApprove
    }
  }
}
</script>

<style lang="scss" scoped>
.vendor-management {
  background-color: #fafafa;
  min-height: 100vh;
}

.page-container {
  max-width: 100%;
  padding: 24px;
}

// Modern Header
.page-header {
  margin-bottom: 32px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .header-info {
    .page-title {
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1a1a1a;
      line-height: 1.2;
    }

    .page-subtitle {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }
  }

  .header-actions {
    .refresh-btn {
      min-width: 120px;
      border-radius: 8px;
    }
  }
}

// Filters Card
.filters-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;

  .filters-section {
    padding: 24px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .search-group {
    grid-column: 1 / -1;
  }

  .filter-group {
    .q-field {
      .q-field__control {
        border-radius: 8px;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    .q-btn {
      border-radius: 8px;
      font-weight: 500;
    }
  }
}

// Selection Banner
.selection-banner {
  margin-bottom: 24px;

  .selection-info {
    border-radius: 12px;
    border: 1px solid #ddd6fe;
    background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);

    .selection-text {
      font-weight: 500;
      color: #374151;
    }
  }
}

// Table Card
.table-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;

  .vendors-table {
    ::v-deep(.q-table__top) {
      padding: 16px 24px;
      border-bottom: 1px solid #f3f4f6;
    }

    ::v-deep(.q-table__bottom) {
      padding: 16px 24px;
      border-top: 1px solid #f3f4f6;
      background: #fafafa;
    }

    ::v-deep(.q-table th) {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      color: #6b7280;
      background: #f9fafb;
    }

    ::v-deep(.q-table td) {
      padding: 16px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    ::v-deep(.q-table tbody tr:hover) {
      background-color: #f9fafb;
    }

    // Company info styling
    .company-info {
      .company-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .vendor-code {
        font-size: 12px;
        color: #6b7280;
        font-family: 'Courier New', monospace;
      }
    }

    // Contact info styling
    .contact-info {
      .contact-name {
        font-weight: 500;
        color: #1f2937;
        margin-bottom: 4px;
        font-size: 14px;
      }

      .contact-details {
        font-size: 12px;
        color: #6b7280;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .email {
          color: #3b82f6;
        }
      }
    }

    // Status chips
    .status-chip, .type-chip {
      font-weight: 500;
      font-size: 11px;
    }

    // Verification badges
    .verification-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;

      .verify-badge {
        font-size: 10px;
        font-weight: 500;
      }

      .no-verification {
        color: #9ca3af;
        font-size: 14px;
      }
    }

    // Rating display
    .rating-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .rating-text {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
    }

    // City info
    .city-info {
      display: flex;
      align-items: center;
      gap: 6px;

      .location-icon {
        color: #6b7280;
      }
    }

    // Action buttons
    .action-buttons-row {
      display: flex;
      gap: 4px;
      justify-content: center;
    }
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .footer-info {
      font-size: 14px;
      color: #6b7280;
    }

    .footer-controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .rows-select {
        min-width: 100px;
      }
    }
  }

  .no-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 16px;

    .no-data-text {
      color: #6b7280;
      font-size: 16px;
    }
  }
}

// Dialog Styling with q-bar
.bulk-add-dialog, .edit-vendor-dialog, .vendor-details-dialog {
  width: 90vw;
  max-width: 1200px;

  .dialog-bar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    font-weight: 600;

    .bar-title {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .q-btn {
      color: white;
    }
  }

  .dialog-content {
    padding: 0;
    max-height: 85vh;
    overflow-y: auto;
  }
}

// Stepper Styling
.vendor-stepper {
  background: white;

  .step-content {
    padding: 32px;

    .step-header {
      margin-bottom: 32px;

      h6 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 8px 0;
      }

      p {
        color: #6b7280;
        margin: 0;
        font-size: 0.875rem;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;

      .form-group {
        &.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          font-size: 0.875rem;
        }

        .form-helper {
          margin-top: 8px;
          font-size: 0.75rem;
          color: #6b7280;
        }
      }
    }
  }

  .stepper-nav {
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;

    .nav-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  }
}

// Edit Dialog Styling
.edit-vendor-dialog {
  .edit-tabs {
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .edit-panels {
    .panel-content {
      padding: 32px;

      .panel-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 24px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;

        .form-group {
          &.full-width {
            grid-column: 1 / -1;
          }
        }
      }
    }
  }

  .form-actions {
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}

// Contact/Address Cards
.contacts-container, .address-container, .business-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contact-card, .address-card, .business-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;

  .contact-header, .address-header, .business-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;

    .company-title {
      font-weight: 600;
      color: #1f2937;
      font-size: 1rem;
    }
  }

  .contact-form-grid, .address-form-grid, .business-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;

    .form-group {
      &.full-width {
        grid-column: 1 / -1;
      }
    }
  }
}

.business-tabs {
  .q-tabs {
    margin-bottom: 16px;
  }
}

// Details Modal Styling
.details-panels {
  .overview-content {
    padding: 24px;

    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;

      .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: #f9fafb;
        border-radius: 8px;
        border: 1px solid #e5e7eb;

        .stat-info {
          .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.2;
          }

          .stat-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 4px;
          }
        }
      }
    }

    .overview-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .detail-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &.full-width {
          grid-column: 1 / -1;
        }

        label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        span {
          color: #1f2937;
        }
      }
    }
  }

  .contact-content, .business-content, .verification-content {
    padding: 24px;

    h6 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .contact-section, .address-section, .business-section, .banking-section, .terms-section {
      margin-bottom: 32px;

      .contact-details, .address-details, .business-details, .banking-details, .terms-details {
        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;

          &:last-child {
            border-bottom: none;
          }

          label {
            font-weight: 500;
            color: #374151;
            min-width: 120px;
            font-size: 0.875rem;
          }

          span {
            color: #1f2937;
            flex: 1;
          }

          .website-link {
            color: #3b82f6;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }

        .address-block {
          margin-bottom: 20px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;

          label {
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
            display: block;
            font-size: 0.875rem;
          }

          p {
            margin: 4px 0;
            color: #1f2937;
            line-height: 1.5;
          }
        }
      }
    }

    .verification-section {
      .verification-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 32px;

        .verification-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;

          .verification-info {
            .verification-label {
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 4px;
            }

            .verification-status {
              font-size: 0.875rem;
              color: #6b7280;
            }
          }
        }
      }
    }

    .approval-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;

      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .page-header .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .filters-card .filters-grid {
    grid-template-columns: 1fr;
  }

  .bulk-add-dialog, .edit-vendor-dialog, .vendor-details-dialog {
    width: 95vw;
    margin: 16px;

    .step-content, .panel-content {
      padding: 16px;

      .form-grid, .contact-form-grid, .address-form-grid, .business-form-grid {
        grid-template-columns: 1fr;
      }
    }

    .stepper-nav, .form-actions {
      padding: 16px;

      .nav-actions {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  }

  .table-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .footer-controls {
      justify-content: space-between;
    }
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }

  .verification-grid {
    grid-template-columns: 1fr;
  }
}

// Custom scrollbar
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

