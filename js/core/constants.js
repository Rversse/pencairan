let editingTransactionId = null

let transactionLimit = 5

let deleteTransactionId = null

const dashboardStartDate = document.getElementById('dashboardStartDate')

const dashboardEndDate = document.getElementById('dashboardEndDate')

const applyDashboardFilter = document.getElementById('applyDashboardFilter')

const kitchenSelect = document.getElementById('kitchenSelect')

const sortTransactions = document.getElementById('sortTransactions')

const accountSelect = document.getElementById('accountSelect')

const supplierSelect = document.getElementById('supplierSelect')

const flowType = document.getElementById('flowType')

const transactionDate = document.getElementById('transactionDate')

const transactionForm = document.getElementById('transactionForm')

const surplusAmount = document.getElementById('surplusAmount')

const amountInput = document.getElementById('amount')

const submitButton = transactionForm.querySelector('button')

const viewerBadge = document.getElementById('viewerBadge')

const transactionsContainer = document.getElementById('transactions')

const totalGas = document.getElementById('totalGas')

const totalExpense = document.getElementById('totalExpense')

const filterKitchen = document.getElementById('filterKitchen')

const filterFlow = document.getElementById('filterFlow')

const filterDate = document.getElementById('filterDate')

const resetFilters = document.getElementById('resetFilters')

const loadMoreButton = document.getElementById('loadMoreButton')

const deleteModal = document.getElementById('deleteModal')

const confirmDeleteButton = document.getElementById('confirmDelete')

const cancelDeleteButton = document.getElementById('cancelDelete')

const exportExcelButton = document.getElementById('exportExcelButton')

const reportStartDate = document.getElementById('startDate')

const reportEndDate = document.getElementById('endDate')

const SUKARAJA_NAME = 'Sukaraja'

const BANK_MODULE_START_DATE = '2026-07-20'
