sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
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

		editAddProduct: function() {
			var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results')
			data.push({});
			this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results', data);
		},

		_onPatternMatch: function (oEvent) {
			this._item = oEvent.getParameter("arguments").item;
			this._bundle = oEvent.getParameter("arguments").bundle;
			if(this._item) {
				this.getView().bindElement({
					path: "/ToGroup/results/" + this._item + "",
					model: "detail"
				});
			}
		},

		editDeleteRow : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
			data.splice(index,1);

			this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results', data);
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
			this.oRouter.navTo("detailDetail", {layout: sNextLayout, bundle: this._bundle, item: this._item});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
			this.oRouter.navTo("detailDetail", {layout: sNextLayout, bundle: this._bundle, item: this._item});
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
