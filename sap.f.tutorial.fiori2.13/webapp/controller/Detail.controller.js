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
			this.oDataModel = this.oOwnerComponent.getModel('invoice');
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this._deepCopy = this.oOwnerComponent.deepCopy;
			this._DatePipe = this.oOwnerComponent.DatePipe;
			this.oDetailModel = this.oOwnerComponent.getModel('detail');
			this.oStateModel = this.oOwnerComponent.getModel('state');
			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);
			this.getView().setModel(new JSONModel([]), 'check');
			this.getView().setModel(new JSONModel({enabled: false}), 'save');
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
			this.data = {};
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

		_refreshDetail () {
			var that = this;
			this.oDataModel.read("/" + this._bundle + '?$expand=ToGroup/ToItem,ToPrice' , {
				success: function (oData) {
					that.data = oData;
					that.oDetailModel.setData(that._deepCopy(oData));
				}
			});
		},

		_onProductMatched: function (oEvent) {
			var _bundle = oEvent.getParameter("arguments").bundle;
			if(_bundle && this._bundle !== _bundle) {
				this._bundle = _bundle;
				this.cancel();
				this._refreshDetail();
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
			this.oStateModel.setProperty('/bEdit', false);
			this.oDetailModel.setData(this._deepCopy(this.data));
		},

		edit: function () {
			this.oStateModel.setProperty('/bEdit', true);
		},


		editAddGroup: function() {
			var groups = this.oDetailModel.getData().ToGroup.results;
			var GrpCode = 'GRP' + (groups.length + 1).toString().padStart(2,'0');
			groups.push({
				GrpCode,
				ToItem:{
					results: []
				}
			});
			this.oDetailModel.setProperty('/ToGroup/results', groups);
		},

		editDeleteGroup: function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				groups = this.oDetailModel.getProperty('/ToGroup/results');
			groups.splice(index,1);

			this.oDetailModel.setProperty('/ToGroup/results', groups);
		},
		save: function () {
			var fnSuccess = function () {
				MessageToast.show('success');
				this.oStateModel.setProperty('/bEdit', false);
				this.oDataModel.refresh();
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(JSON.parse(oError.response.body).error.message.value);
			}.bind(this);
			var sPath = "/" + this._bundle;
			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			
			var data = this._deepCopy(this.oDetailModel.getData());

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
					group.GrpScopeDesc = group.GrpScope.split(' ')[1];
					group.GrpScope = group.GrpScope.split(' ')[0];
					group.ToItem = group.ToItem.results;
					if (group.ToItem.length != 0) {
						group.ToItem.forEach(item => {
							this._DatePipe(item,'ValidFrom');
							this._DatePipe(item,'ValidTo');
							if (item.ItemId === undefined) {
								item.Changeflag = "C";
							} else {
								item.Changeflag = "U";
							}
							
							item.GrpId = group.GrpId;
							item.GrpScope = group.GrpScope.split(' ')[0];
						});
					}
				});
			}

			sPath = 'BundleHeadSet';

			this.oDataModel.create(sPath, data, mParameters);
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

		onConfirmDialog: function () {
			var fnSuccess = function (data) {
				MessageToast.show('success');
				this.oDataModel.refresh();
				this.onCloseDialog();
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(JSON.parse(oError.response.body).error.message.value);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this._deepCopy(this.oDetailModel.getData());
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
			this.oDataModel.create(sPath, data, mParameters);
		},

		check: function () {
			var fnSuccess = function (data) {
				var price = data.ToPrice.results || [];
				this.getView().getModel('save').setData({enabled: price.every(p => p.MessageType === "")});
				this.getView().getModel('check').setData(price);
				MessageToast.show('success');
			}.bind(this);

			var fnError = function (oError) {
				MessageBox.error(JSON.parse(oError.response.body).error.message.value);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this._deepCopy(this.oDetailModel.getData());
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
			this.oDataModel.create(sPath, data, mParameters);
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
