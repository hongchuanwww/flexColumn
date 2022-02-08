sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
], function (Controller, MessageToast, MessageBox, JSONModel) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Detail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();

			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);
		},

		onSupplierPress: function (oEvent) {
			var itemPath = oEvent.getSource().getBindingContext('detail').getPath(),
			item = itemPath.split("/").slice(-1).pop();
			var	oNextUIState;
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("detailDetail", {
					layout: oNextUIState.layout,
					item: item,
					bundle: this._bundle
				});
			}.bind(this));
		},

		_onProductMatched: function (oEvent) {
			this._bundle = oEvent.getParameter("arguments").bundle;
			if(this._bundle) {
				this.cancel();
				var that = this;
				this.oOwnerComponent.getModel('invoice').read("/" + this._bundle + '?$expand=ToGroup/ToItem,ToPrice' , {
					success: function (oData) {
						var groups = oData.results;
						var oModel = new JSONModel();
						oModel.setData(oData);
						that.getView().setModel(oModel,'detail');
					}
				});
			}
		},

		onEditToggleButtonPress: function() {
			var oObjectPage = this.getView().byId("ObjectPageLayout"),
				bCurrentShowFooterState = oObjectPage.getShowFooter();

			oObjectPage.setShowFooter(!bCurrentShowFooterState);
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("detail", {layout: sNextLayout, bundle: this._bundle});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", {layout: sNextLayout, bundle: this._bundle});
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("master", {layout: sNextLayout});
		},

		onExit: function () {
			this.oRouter.getRoute("master").detachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").detachPatternMatched(this._onProductMatched, this);
		},

		cancel: function () {
			this.oModel.setProperty('/bEdit', false);
		},

		edit: function () {
			this.oModel.setProperty('/bEdit', true);
		},

		_DatePipe: function(obj, prop) {
			if(obj[prop]) {
				obj[prop] = new Date(obj[prop]);
			}
		},

		editAddGroup: function() {
			var oDataModel = this.getView().getModel('detail');
			var groups = oDataModel.getData().ToGroup.results;
			groups.push({
				ToItem:{
					results: []
				}
			});
			oDataModel.setProperty('/ToGroup/results', groups);
		},

		save: function () {
			var fnSuccess = function () {
				MessageToast.show('success');
				this.handleClose();
				this.cancel();
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(oError.message);
			}.bind(this);
			var sPath = "/" + this._bundle;
			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			
			var oDataModel = this.getView().getModel('detail');
			var data = JSON.parse(JSON.stringify(oDataModel.getData()));

			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');

			data.Changeflag = "U";
			data.ToPrice = data.ToPrice.results;
			if (data.ToPrice.length != 0) {
				data.ToPrice.forEach(price => {
					this._DatePipe(price,'ValidFrom');
					this._DatePipe(price,'ValidTo');
					price.Changeflag = "U";
				});
			}

			data.ToGroup = data.ToGroup.results;
			if (data.ToGroup.length != 0) {
				data.ToGroup.forEach(group => {
					group.Changeflag = "U";

					group.ToItem = group.ToItem.results;
					if (group.ToItem.length != 0) {
						group.ToItem.forEach(item => {
							this._DatePipe(item,'ValidFrom');
							this._DatePipe(item,'ValidTo');
							item.Changeflag = "U";
						});
					}
				});
			}

			sPath = 'BundleHeadSet';

			this.oOwnerComponent.getModel('invoice').create(sPath, data, mParameters);
		}
	});
});
