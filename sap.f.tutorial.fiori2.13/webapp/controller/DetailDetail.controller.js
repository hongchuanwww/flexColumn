sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller"
], function (JSONModel, Controller) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.DetailDetail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();

			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onPatternMatch, this);
		},

		handleAboutPress: function () {
			var oNextUIState;
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(3);
				this.oRouter.navTo("page2", {layout: oNextUIState.layout});
			}.bind(this));
		},

		_onPatternMatch: function (oEvent) {
			// this._supplier = oEvent.getParameter("arguments").supplier || this._supplier || "0";
			// this._product = oEvent.getParameter("arguments").product || this._product || "0";

			this._item = oEvent.getParameter("arguments").item;
			// this.getView().bindElement({
			// 	path: "/ProductCollectionStats/Filters/1/values/" + this._supplier,
			// 	model: "products"
			// });
			if(this._item) {
				this.getView().bindElement({
					path: "/" + this._item + "",
					model: "invoice"
				});
			}
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
			this.oRouter.navTo("detailDetail", {layout: sNextLayout, bundle: this._bundle});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
			this.oRouter.navTo("detailDetail", {layout: sNextLayout, bundle: this._bundle});
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
			this.oRouter.navTo("detail", {layout: sNextLayout, bundle: this._bundle});
		},

		onExit: function () {
			this.oRouter.getRoute("detailDetail").detachPatternMatched(this._onPatternMatch, this);
		}
	});
});
