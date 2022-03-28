sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox'
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Master", {
		onInit: function () {
			this.oView = this.getView();
			this._bDescendingSort = false;
			this.oProductsTable = this.oView.byId("productsTable");
			this.oRouter = this.getOwnerComponent().getRouter();
		},

		onSearch: function (oEvent) {
			var aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl,i) {
				var value = oControl.getValue?.() || oControl.getSelectedKey?.();
				if (value) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: i > 3 ? FilterOperator.EQ : FilterOperator.Contains,
						value1: value
					}));
				}

				return aResult;
			}, []);
			this.oProductsTable.getBinding("items").filter([new Filter({
				filters: aFilters,
				and: true
			})], "Application");
		},

		onClear: function(oEvent) {
			oEvent.getParameter("selectionSet").forEach(function(oControl) {
				oControl?.setValue(null) || oControl?.getSelectedKey(null);
			});
			this.oProductsTable.getBinding("items").filter([new Filter({
				filters: []
			})], "Application");
		},

		onAdd: function () {
			MessageBox.information("This functionality is not ready yet.", {title: "Aw, Snap!"});
		},

		onSort: function () {
			this._bDescendingSort = !this._bDescendingSort;
			var oBinding = this.oProductsTable.getBinding("items"),
				oSorter = new Sorter("Name", this._bDescendingSort);

			oBinding.sort(oSorter);
		},

		onListItemPress: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("invoice").getPath(),
				bundle = path.split("/").slice(-1).pop().replace('BundleListSet','BundleHeadSet'),
				oNextUIState;
			this.getOwnerComponent().getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("detail", {
					layout: oNextUIState.layout,
					bundle: bundle
				});
			}.bind(this));
		},

		onCreateButtonPress: function (oEvent) {
			var oNextUIState;
			this.getOwnerComponent().getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("create", {
					// layout: oNextUIState.layout
					layout: 'MidColumnFullScreen'
				});
			}.bind(this));
		},
	});
});
