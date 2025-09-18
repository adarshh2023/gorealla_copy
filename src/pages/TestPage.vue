<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm">
      <div class="col">
        <h4 class="q-mb-xs">Vendors</h4>
        <div class="text-subtitle2">Manage suppliers, contractors & manufacturers</div>
      </div>

      <div class="col-auto">
        <q-btn flat round dense icon="file_upload" label="Import" @click="onImport" />
        <q-btn flat round dense icon="file_download" label="Export" @click="onExport" />
        <q-btn color="primary" label="+ Add Vendor" class="q-ml-sm" @click="openAdd" />
      </div>
    </div>

    <!-- KPI strip (simple) -->
    <div class="row q-mt-md q-gutter-sm">
      <q-card flat bordered class="col">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="text-caption">Total Vendors</div>
            <div class="text-h6">{{ stats.total }}</div>
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section>
          <div class="text-caption">Approved</div>
          <div class="text-h6">{{ stats.approved }}</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section>
          <div class="text-caption">Provisional</div>
          <div class="text-h6">{{ stats.provisional }}</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="col">
        <q-card-section>
          <div class="text-caption">Preferred</div>
          <div class="text-h6">{{ stats.preferred }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Filters & Search -->
    <div class="row q-mt-md q-gutter-sm items-center">
      <div class="col">
        <q-input dense debounce="300" v-model="search" placeholder="Search vendor, code, contact, GST..." @input="fetch">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="col-auto">
        <q-select dense outlined v-model="filters.vendorType" :options="vendorTypeOptions" label="Vendor Type" @input="fetch" style="min-width:160px" />
      </div>

      <div class="col-auto">
        <q-btn flat dense label="Advanced filters" icon="filter_list" @click="openAdvancedFilters" />
      </div>
    </div>

    <!-- Table + Drawer layout -->
    <div class="row q-mt-md">
      <div class="col">
        <q-card>
          <q-table
            flat
            grid
            :rows="rows"
            :columns="columns"
            row-key="RecCode"
            v-model:pagination="pagination"
            :loading="loading"
            selection="multiple"
            v-model:selected="selected"
            @request="onRequest"
            :rows-per-page-options="[10,25,50,100]"
          >
            <template v-slot:top-right>
              <q-btn dense flat icon="more_vert" @click="onBulkActions" />
            </template>

            <template v-slot:body-cell-CompanyName="props">
              <q-td :props="props">
                <div class="row items-center no-wrap">
                  <div class="col">
                    <a href="#" @click.prevent="openDrawer(props.row)">{{ props.row.CompanyName }}</a>
                    <div class="text-caption text-ellipsis">{{ props.row.VendorCode }} • {{ props.row.VendorCategory }}</div>
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-OverallRating="props">
              <q-td :props="props">
                <q-rating readonly size="14px" v-model="props.row.OverallRating" max="5" />
                <div class="text-caption">{{ props.row.OverallRating?.toFixed(2) ?? '0.00' }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-Actions="props">
              <q-td :props="props">
                <q-btn dense flat round icon="open_in_new" @click="openDrawer(props.row)" />
                <q-btn dense flat round icon="edit" @click="openEdit(props.row)" />
                <q-btn dense flat round icon="check_circle" @click="openApprove(props.row)" v-if="props.row.ApprovalStatus === 'Pending'" />
                <q-btn dense flat round icon="more_vert" @click="() => onRowMenu(props.row)" />
              </q-td>
            </template>
          </q-table>

          <q-separator />

          <div class="row items-center q-pa-sm">
            <div class="col">
              <q-btn flat size="sm" label="Approve selected" @click="bulkApprove" :disable="!selected.length" />
              <q-btn flat size="sm" label="Set Preferred" @click="bulkPreferred" :disable="!selected.length" />
            </div>

            <div class="col-auto">
              <q-pagination v-model="pagination.page" :max="pageCount" max-pages="6" @update:model-value="onPageChange" />
            </div>
          </div>
        </q-card>
      </div>

      <!-- Right drawer / details -->
      <div style="width:420px" class="col-auto">
        <q-drawer v-model="drawerOpen" side="right" bordered show-if-above width="420">
          <q-toolbar>
            <q-toolbar-title>
              <div class="text-subtitle1">{{ drawerRow?.CompanyName || 'Vendor details' }}</div>
              <div class="text-caption">{{ drawerRow?.VendorCode }}</div>
            </q-toolbar-title>
            <q-btn dense flat icon="close" @click="drawerOpen = false" />
          </q-toolbar>

          <q-scroll-area class="fit">
            <div class="q-pa-md">
              <div v-if="drawerRow">
                <div class="text-caption q-mb-sm">Contact</div>
                <div>{{ drawerRow.ContactPersonName }} • {{ drawerRow.Phone }}</div>
                <div class="text-caption q-mt-md">Address</div>
                <div class="text-body2">{{ drawerRow.RegisteredAddress }}</div>

                <q-separator spaced />

                <div class="row q-mt-md">
                  <div class="col">
                    <div class="text-caption">Payment Terms</div>
                    <div>{{ drawerRow.PaymentTerms || '-' }}</div>
                  </div>
                  <div class="col">
                    <div class="text-caption">Credit Limit</div>
                    <div>{{ formatCurrency(drawerRow.CreditLimit) }}</div>
                  </div>
                </div>

                <q-separator spaced />
                <div class="q-mt-md">
                  <div class="text-caption">Verification</div>
                  <div class="row q-gutter-sm q-mt-sm">
                    <q-chip dense outline small icon="verified" v-if="drawerRow.IsGSTVerified">GST</q-chip>
                    <q-chip dense outline small icon="verified" v-if="drawerRow.IsPANVerified">PAN</q-chip>
                    <q-chip dense outline small icon="verified" v-if="drawerRow.IsBankDetailsVerified">Bank</q-chip>
                  </div>
                </div>

                <q-separator spaced />

                <div class="row q-mt-md">
                  <q-btn color="primary" label="Edit" flat @click="openEdit(drawerRow)" />
                  <q-btn color="green" label="Approve" flat @click="openApprove(drawerRow)" v-if="drawerRow.ApprovalStatus === 'Pending'" class="q-ml-sm" />
                </div>
              </div>

              <div v-else class="q-pa-md text-center text-grey">Select a vendor to view details</div>
            </div>
          </q-scroll-area>
        </q-drawer>
      </div>
    </div>

    <!-- Approve Dialog -->
    <q-dialog v-model="approveDialog">
      <q-card style="min-width:420px">
        <q-card-section>
          <div class="text-h6">Approve Vendor</div>
          <div class="text-caption">Vendor: {{ approveRow?.CompanyName }}</div>
        </q-card-section>

        <q-card-section>
          <q-list bordered>
            <q-item>
              <q-item-section>GST verified</q-item-section>
              <q-item-section side><q-checkbox v-model="approveChecks.gst" /></q-item-section>
            </q-item>
            <q-item>
              <q-item-section>PAN verified</q-item-section>
              <q-item-section side><q-checkbox v-model="approveChecks.pan" /></q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Bank details verified</q-item-section>
              <q-item-section side><q-checkbox v-model="approveChecks.bank" /></q-item-section>
            </q-item>
          </q-list>

          <q-input v-model="provisionExpiry" label="Provision approval expiry (optional)" mask="####-##-##" placeholder="YYYY-MM-DD" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup @click="approveDialog=false" />
          <q-btn color="primary" label="Approve" :disable="!canApprove" @click="doApprove" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

const $q = useQuasar()

const rows = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, rowsPerPage: 25, sortBy: 'CompanyName', descending: false })
const pageCount = ref(1)
const selected = ref([])

const columns = [
  { name: 'VendorCode', label: 'Code', field: 'VendorCode', sortable: true, align: 'left', style: 'width:120px' },
  { name: 'CompanyName', label: 'Name', field: 'CompanyName', sortable: true, required: true },
  { name: 'VendorCategory', label: 'Category', field: 'VendorCategory', sortable: false },
  { name: 'City', label: 'Location', field: r => `${r.City}, ${r.State}`, sortable: true },
  { name: 'OverallRating', label: 'Rating', field: 'OverallRating', sortable: true, align: 'center' },
  { name: 'VendorStatus', label: 'Status', field: 'VendorStatus', sortable: true, align: 'center' },
  { name: 'Actions', label: '', field: 'Actions', sortable: false, style: 'width:140px' }
]

// eslint-disable-next-line no-unused-vars
const paginationServerDefaults = { page: 1, rowsPerPage: 25 }
const search = ref('')
const filters = reactive({ vendorType: null })

const stats = reactive({ total: 0, approved: 0, provisional: 0, preferred: 0 })

const drawerOpen = ref(false)
const drawerRow = ref(null)

const approveDialog = ref(false)
const approveRow = ref(null)
const approveChecks = reactive({ gst: false, pan: false, bank: false })
const provisionExpiry = ref(null)

// eslint-disable-next-line no-unused-vars
const loadingStats = ref(false)

const vendorTypeOptions = [
  'Supplier', 'Contractor', 'Manufacturer', 'Trader'
].map(v => ({ label: v, value: v }))

// eslint-disable-next-line no-unused-vars
const rowsPerPageOptions = [10,25,50,100]

const fetch = async () => {
  loading.value = true
  try {
    const params = {
      q: search.value,
      page: pagination.value.page,
      perPage: pagination.value.rowsPerPage,
      vendorType: filters.vendorType
    }
    const resp = await axios.get('/api/vendors', { params })
    rows.value = resp.data.items
    pageCount.value = Math.ceil(resp.data.total / pagination.value.rowsPerPage)
    stats.total = resp.data.stats.total
    stats.approved = resp.data.stats.approved
    stats.provisional = resp.data.stats.provisional
    stats.preferred = resp.data.stats.preferred
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to load vendors' })
  } finally {
    loading.value = false
  }
}

const onRequest = (props) => {
  // props.pagination contains page, rowsPerPage, sortBy etc.
  pagination.value = props.pagination
  fetch()
}

const openDrawer = (row) => {
  drawerRow.value = row
  drawerOpen.value = true
  // lazy load details if needed
  // fetch(`/api/vendors/${row.RecCode}/details`)
}

// eslint-disable-next-line no-unused-vars
const openEdit = (row) => {
  // open edit modal (not implemented here)
  $q.notify({ message: 'Open edit modal (not implemented in scaffold)' })
}

const openAdd = () => {
  $q.notify({ message: 'Open add vendor modal (not implemented in scaffold)' })
}

const openApprove = (row) => {
  approveRow.value = row
  approveChecks.gst = !!row.IsGSTVerified
  approveChecks.pan = !!row.IsPANVerified
  approveChecks.bank = !!row.IsBankDetailsVerified
  approveDialog.value = true
}

const canApprove = computed(() => approveChecks.gst && approveChecks.pan)

const doApprove = async () => {
  try {
    await axios.post(`/api/vendors/${approveRow.value.RecCode}/approve`, {
      gstVerified: approveChecks.gst,
      panVerified: approveChecks.pan,
      bankVerified: approveChecks.bank,
      provisionExpiry: provisionExpiry.value
    })
    $q.notify({ type: 'positive', message: 'Vendor approved' })
    approveDialog.value = false
    fetch()
    // eslint-disable-next-line no-unused-vars
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Failed to approve vendor' })
  }
}

const onExport = () => {
  // trigger export endpoint with current filters
  $q.notify({ message: 'Export started (implement backend export)' })
}
const onImport = () => $q.notify({ message: 'Open import flow' })
const onBulkActions = () => $q.notify({ message: 'Open bulk actions menu' })

const bulkApprove = () => {
  $q.dialog({ title: 'Confirm', message: `Approve ${selected.value.length} vendors?` })
    .onOk(async () => {
      // call backend bulk approve
      await axios.post('/api/vendors/bulk/approve', { ids: selected.value.map(r => r.RecCode) })
      $q.notify({ type: 'positive', message: 'Bulk approved' })
      fetch()
    })
}

const bulkPreferred = async () => {
  await axios.post('/api/vendors/bulk/preferred', { ids: selected.value.map(r => r.RecCode), preferred: true })
  $q.notify({ type: 'positive', message: 'Updated preferred status' })
  fetch()
}

const onRowMenu = (row) => {
  $q.notify({ message: `Row menu for ${row.CompanyName}` })
}

const onPageChange = (page) => {
  pagination.value.page = page
  fetch()
}

const formatCurrency = (v) => {
  if (v == null) return '-'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v)
}

watch([() => pagination.value.page, () => pagination.value.rowsPerPage], fetch)
watch(search, () => { pagination.value.page = 1; fetch() }, { debounce: 300 })

// initial load
fetch()
</script>

<style scoped>
a { color: var(--q-primary); text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
