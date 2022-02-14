sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
], function (Controller, MessageToast, MessageBox, JSONModel, Fragment) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Detail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oDetailModel = this.oOwnerComponent.getModel('detail');

			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);
			this.getView().setModel(new JSONModel([]), 'check');
			this.getView().getModel('check').setSizeLimit(10000);
			this.DIC = [
				'Province',
				'RegionDesc',
				'AgreeId',
				'BpCodeInAgree',
				'Rate',
				'RateUnit',
				'Cap',
				'ValidFrom',
				'ValidTo',
			];
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
						that.oDetailModel.setData(oData);
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
			var groups = this.oDetailModel.getData().ToGroup.results;
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
			
			var data = JSON.parse(JSON.stringify(this.oDetailModel.getData()));

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
		},
		openDialog: function () {
			var oView = this.getView();

			// create dialog lazily
			if (!this.byId("checkDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "zychcn.zbundle01.view.CheckDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("checkDialog").open();
			}
		}, 
		onCloseDialog: function () {
			var that = this;
			that.getView().getModel('check').setData([]);
			this.byId("checkDialog").close();
		},
		// onConfirmDialog: function () {
		// 	this.oOwnerComponent.getModel('invoice').refresh();
		// 	this.onCloseDialog();
		// },

		onConfirmDialog: function () {
			var fnSuccess = function (data) {
				MessageToast.show('success');
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(oError.response.body);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = JSON.parse(JSON.stringify(this.oDetailModel.getData()));
			var prices = this.getView().getModel('check').getData();
			data.ToPrice = prices;

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			data.Changeflag = "U";
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "C";
			});
			this.oOwnerComponent.getModel('invoice').create(sPath, data, mParameters);
			this.onCloseDialog();
		},

		check: function () {
			var fnSuccess = function (data) {
				MessageToast.show('success');
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(oError.response.body);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = JSON.parse(JSON.stringify(this.oDetailModel.getData()));
			var prices = this.getView().getModel('check').getData();
			data.ToPrice = prices;

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			data.Changeflag = "M";
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "C";
			});
			// data.ToGroup = data.ToGroup.results;
			// data.ToGroup.forEach(group => {
			// 	group.Changeflag = "C";
			// 	group.ToItem = group.ToItem.results;
			// 	group.ToItem.forEach(item => {
			// 		this._DatePipe(item,'ValidFrom');
			// 		this._DatePipe(item,'ValidTo');
			// 		item.Changeflag = "C";
			// 	});
			// });
			this.oOwnerComponent.getModel('invoice').create(sPath, data, mParameters);
		},
		firePaste: function(oEvent) {
			var oTable = this.getView().byId("checkTable");
			navigator.clipboard.readText().then(
				function(text) {
					var _arr = text.split('\r\n');
					for (var i in _arr) {
						_arr[i] = _arr[i].split('\t');
					}
					oTable.firePaste({
						"data": _arr
					});
				}.bind(this)
			);
		},

        onPaste: function (e) {
			var pasteData = e.getParameters().data;
            var data = pasteData.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj[this.DIC[i]] = row[i];
				}
				return obj;
			});
			this.getView().getModel('check').setData(data);
		},
	});
});
