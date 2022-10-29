sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/Sorter',
	'sap/ui/export/Spreadsheet',
	'sap/ui/export/library',
	'sap/ui/core/BusyIndicator'
], function (Controller, MessageToast, MessageBox, JSONModel, Fragment, Filter, FilterOperator, Sorter, Spreadsheet, exportLibrary, BusyIndicator) {
	"use strict";
	var EdmType = exportLibrary.EdmType;
	return Controller.extend("zychcn.zbundle01.controller.Detail", {
		onInit: function () {
			this._mViewSettingsDialogs = {};
			this.oOwnerComponent = this.getOwnerComponent();
			this.oDataModel = this.oOwnerComponent.getModel('invoice');
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this._deepCopy = this.oOwnerComponent.deepCopy;
			this._DatePipe = this.oOwnerComponent.DatePipe;
			this.oDetailModel = this.oOwnerComponent.getModel('detail');
			this.oStateModel = this.oOwnerComponent.getModel('state');
			this.oProductModel = this.oOwnerComponent.getModel('product');
			this.oColModel = this.oOwnerComponent.getModel('columns');
			// this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);
			this.getView().setModel(new JSONModel([]), 'check');
			this.getView().setModel(new JSONModel(), 'detailProduct');
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
			this._item = item;
			// var	oNextUIState;
			// this.oOwnerComponent.getHelper().then(function (oHelper) {
			// 	if (this.oStateModel.getProperty('/bEdit') == true) {
			// 		oNextUIState = oHelper.getNextUIState(3);
			// 	} else {
			// 		oNextUIState = oHelper.getNextUIState(2);
			// 	}
				
			// 	this.oRouter.navTo("detailDetail", {
			// 		layout: 'EndColumnFullScreen',
			// 		// layout: oNextUIState.layout,
			// 		item: item,
			// 		bundle: this._bundle
			// 	});
			// }.bind(this));
			var oView = this.getView();
			oView.getModel('detailProduct').setData(oView.getModel('detail').getProperty("/ToGroup/results/" + item));
			// create dialog lazily
			if (!this.byId("detailDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "zychcn.zbundle01.view.DetailDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("detailDialog").open();
			}
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
			var _item = oEvent.getParameter("arguments").item;
			var GrpCode = this.oDetailModel.getProperty("/ToGroup/results/" + _item + '/GrpCode');
			this.oStateModel.setProperty('/navigatedItem',GrpCode);
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
			var Changeflag = 'C';
			groups.push({
				GrpCode,
				Changeflag,
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

		editDeletePrice: function(e) {
				var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				groups = this.oDetailModel.getProperty('/ToPrice/results');
			groups.splice(index,1);

			this.oDetailModel.setProperty('/ToPrice/results', groups);
		},

		_naviToDetail: function(HeadId) {
			if(HeadId) {
				this.getOwnerComponent().getHelper().then(function (oHelper) {
					// oNextUIState = oHelper.getNextUIState(1);
					this.oRouter.navTo("detail", {
						layout: 'TwoColumnsMidExpanded',
						bundle: `BundleHeadSet('${HeadId}')`
					});
				}.bind(this));
			}
		},

		delete: function () {
			var fnSuccess = function (e) {
				MessageToast.show('success');
				this.oStateModel.setProperty('/bEdit', false);
				this.oDataModel.refresh();

				// Successful delete nvigation part need to verify
				var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
				this.oRouter.navTo("master", {layout: sNextLayout});
				// 
			}.bind(this);

			var fnError = function (oError) {
				var errMsg = "";
				var res = JSON.parse(oError.response.body).error.innererror.errordetails; 

				res.forEach(r => {
					errMsg += r.message + '\r\n';
				});

				MessageBox.error(errMsg);
			}.bind(this);
			var sPath = "/" + this._bundle;
			var mParameters = {
				error: fnError,
				success: fnSuccess
			};

			this.oDataModel.remove(sPath, mParameters);
			this.oDataModel.refresh();
			this._refreshDetail();
		},

		save: function () {
			var fnSuccess = function (e) {
				MessageToast.show('success');
				this.oStateModel.setProperty('/bEdit', false);
				this.oDataModel.refresh();
				this._refreshDetail();
				this._naviToDetail(e.HeadId);
			}.bind(this);

			var fnError = function (oError) {
				var errMsg = "";
				var res = JSON.parse(oError.response.body).error.innererror.errordetails; 

				res.forEach(r => {
					errMsg += r.message + '\r\n';
				});

				MessageBox.error(errMsg);
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
			data.Qty = data.Qty.toString();
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
					if (group.Changeflag != "C") {
						group.Changeflag = "U";
					}
					group.GrpScopeDesc = group.GrpScope.split(' ')[1] || group.GrpScopeDesc;
					group.GrpScope = group.GrpScope.split(' ')[0];
					group.ToItem = group.ToItem.results;
					group.GrpQty = group.GrpQty.toString();
					if (group.ToItem.length != 0) {
						group.ToItem.forEach(item => {
							this._DatePipe(item,'ValidFrom');
							this._DatePipe(item,'ValidTo');
							if (item.ItemId === undefined) {
								item.Changeflag = "C";
							} else {
								item.Changeflag = "U";
							}
							delete item.ProductDescZh
							item.GrpId = group.GrpId;
							item.GrpScope = group.GrpScope.split(' ')[0];
						});
					}
				});
			}

			sPath = 'BundleHeadSet';

			this.oDataModel.create(sPath, data, mParameters);
			this.oDataModel.refresh();
			this._refreshDetail();
		},
		openDialog: function () {
			var oView = this.getView();
			
			this.getView().getModel('save').setData({enabled: false});
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

		onCloseDetailDialog: function () {
			this.byId("detailDialog").close();
		},

		// DetailProduct view methods ---------

		editAddProduct: function() {
			var data = this.getView().getModel('detailProduct').getProperty("/ToItem/results/")
			data.push({})
			this.getView().getModel('detailProduct').setProperty("/ToItem/results/", data)
		},

		_getProductList: function() {
			var that = this;
			BusyIndicator.show();
			this.getView().getModel('invoice').read('/SHScopeSet?$filter=GrpScope%20eq%20%27'+this.GrpScope+'%27%20and%20BuId%20eq%20%27'+this.BuId+'%27', {
				success: function (oData) {
					that.oProductModel.setData(oData.results);
					that._openValueHelp();
					BusyIndicator.hide();
				},
				error: function (error) {
					MessageBox.error(error);
					BusyIndicator.hide();
				}
			});
		},

		firePaste: function(oEvent) {
			var oTable = this.getView().byId("itemTable");
			navigator.clipboard.readText().then(
				function(text) {
					if (text.length > 0 && text.substring(text.length - 2) == '\r\n') {
						text = text.substring(0, text.length - 2);
					}
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
			var data = this.getView().getModel('detailProduct').getProperty("/ToItem/results/");
            var newData = pasteData.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj[this.DIC[i]] = row[i];
					if(this.DIC[i].startsWith('Valid')) {
						this._DatePipe(obj,this.DIC[i]);
					}
				}
				return obj;
			});
			
			for (var i = 0; i < newData.length; i++) {
				data.push(newData[i]);
			}
			this.getView().getModel('detailProduct').setProperty("/ToItem/results/", data)
		},

		editDeleteRow : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				data = this.getView().getModel('detailProduct').getProperty("/ToItem/results/");
			data.splice(index,1);

			this.getView().getModel('detailProduct').setProperty("/ToItem/results/", data)
		},

		_openValueHelp: function () {
			var aCols = this.oColModel.getData().cols;
			Fragment.load({
				name: "zychcn.zbundle01.view.ValueHelpDialogSelect",
				controller: this
			}).then(function name(oFragment) {
				this._oValueHelpDialog = oFragment;
				this.getView().addDependent(this._oValueHelpDialog);

				this._oValueHelpDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(this.oProductModel);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) {
						oTable.bindAggregation("rows", "/");
					}

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/", function () {
							return new ColumnListItem({
								cells: aCols.map(function (column) {
									return new Label({ text: "{" + column.template + "}" });
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));
				
				// var oToken = new Token();
				// oToken.setKey(this._oInput.getSelectedKey());
				// oToken.setText(this._oInput.getValue());
				// this._oValueHelpDialog.setTokens([oToken]);
				this._oValueHelpDialog.open();
			}.bind(this));
		},

		onValueHelpRequested: function(oEvent) {
			var group = this.getView().getModel('detail').getProperty( "/ToGroup/results/" + this._item);
			this.GrpScope = group?.GrpScope?.split(' ')[0];
			var data = this.getView().getModel('detail').getData();
			this.BuId = data.BuId?.split(' ')[0];
			if(!this.GrpScope || !this.BuId) {
				MessageBox.error('Please select BU ID and Group Scope');
				return;
			}
			this._oInput = oEvent.getSource();
			this._getProductList();
		},

		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			// this._oInput.setTokens(aTokens);
			if (aTokens.length == 0) {
				this._oInput.setSelectedKey(aTokens[i].getKey());
			} else {
				// var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
				var data = this.getView().getModel('detailProduct').getProperty("/ToItem/results/")
				data.splice(data.length - 1, 1);
				for (var i = 0; i < aTokens.length; i++) {
					data.push({
						"Product": aTokens[i].getKey(),
						"ProductDescZh": aTokens[i].getText()
					});
				}
				this.getView().getModel('detailProduct').setProperty("/ToItem/results/", data)
				// this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results', data);
			}
			
			this._oValueHelpDialog.close();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},

		// DetailProduct view methods end ----------------

		onConfirmDialog: function () {
			var fnSuccess = function (data) {
				MessageToast.show('success');
				this._refreshDetail();
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
				price.sort((p1, p2) => (p1.MessageType > p2.MessageType) ? -1: 1)
				this.getView().getModel('save').setData({enabled: price.every(p => (p.MessageType === "" || p.MessageType === "W"))});
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
				
				delete price.HeadId
				delete price.MessageType
				delete price.MessageText

				price.Changeflag = "C";
			});
			this.oDataModel.create(sPath, data, mParameters);
		},
		firePaste: function(oEvent) {
			var oTable = this.getView().byId("checkTable");
			navigator.clipboard.readText().then(
				function(text) {
					if (text.length > 0 && text.substring(text.length - 2) == '\r\n') {
						text = text.substring(0, text.length - 2);
					}
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

		clearPaste: function(oEvent) {
			var data = {};
			this.getView().getModel('check').setData(data);
		},

        onPaste: function (e) {
			var pasteData = e.getParameters().data;
            var data = pasteData.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj[this.DIC[i]] = row[i];
					if(this.DIC[i].startsWith('Valid')) {
						this._DatePipe(obj,this.DIC[i]);
					}
				}
				return obj;
			});
			this.getView().getModel('check').setData(data);
		},

		onAddPrice: function (e) {
			var price = this.getView().getModel('check').getData();
			price.push({});
			this.getView().getModel('check').setData(price);
		},

		onDeletePrice: function (e) {
			var btn = e.getSource(),
			row = btn.getParent(),
			table = row.getParent(),
			index = table.indexOfItem(row),
			prices = this.getView().getModel('check').getData();
			prices.splice(index,1);
			this.getView().getModel('check').setData(prices);
		},

		isNavigated: function(sNavigatedItemId, sItemId) {
			return sNavigatedItemId === sItemId;
		},

		handleSortButtonPressed: function () {
			var oView = this.getView();
			this.getViewSettingsDialog("zychcn.zbundle01.view.SortDialog")
				.then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
		},

		getViewSettingsDialog: function (sDialogFragmentName) {
			var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!pDialog) {
				pDialog = Fragment.load({
					id: this.getView().getId(),
					name: sDialogFragmentName,
					controller: this
				}).then(function (oDialog) {
					return oDialog;
				});
				this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
			}
			return pDialog;
		},

		handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("idPriceTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		onAgreementFilter: function (oEvent) {
			var oTable = this.byId("idPriceTable"),
			oBinding = oTable.getBinding("items"),
			
			// aFilters = [new Filter("AgreeId", FilterOperator.Contains, oEvent.getSource().getValue()), new Filter("Rate", FilterOperator.Contains, oEvent.getSource().getValue())];
			aFilters = [new Filter("AgreeId", FilterOperator.Contains, oEvent.getSource().getValue())]
			// apply filter settings
			oBinding.filter(aFilters);
		},

		onCustomerFilter: function (oEvent) {
			var oTable = this.byId("idPriceTable"),
			oBinding = oTable.getBinding("items"),
			
			// aFilters = [new Filter("AgreeId", FilterOperator.Contains, oEvent.getSource().getValue()), new Filter("Rate", FilterOperator.Contains, oEvent.getSource().getValue())];
			bFilters = [new Filter("BpCodeInAgree", FilterOperator.Contains, oEvent.getSource().getValue())]
			// apply filter settings
			oBinding.filter(bFilters);
		},

		createColumnConfig: function() {
			return [{
				property: 'Province',
				type: EdmType.String
			},{
				property: 'RegionDesc',
				type: EdmType.String
			},{
				property: 'AgreeId',
				type: EdmType.String
			},{
				property: 'BpCodeInAgree',
				type: EdmType.String
			},{
				property: 'Rate',
				type: EdmType.Number
			},{
				property: 'RateUnit',
				type: EdmType.String
			},{
				property: 'Cap',
				type: EdmType.Number
			},{
				property: 'ValidFrom',
				type: EdmType.Date
			},{
				property: 'ValidTo',
				type: EdmType.Date
			},{
				property: 'MessageType',
				type: EdmType.String
			},{
				property: 'MessageText',
				type: EdmType.String
			}];
		},
		onExport: function() {
			var aCols = this.createColumnConfig(),
			oSettings = {
				workbook: {
					columns: aCols,
					// hierarchyLevel: 'Level'
				},
				dataSource: this.oDetailModel.getProperty('/ToPrice/results'),
				fileName: 'Price.xlsx',
				worker: true // We need to disable worker because we are using a MockServer as OData Service
			},
			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
		},
		createCaculateColumnConfig: function() {
			return [{
				property: 'Province',
				type: EdmType.String
			},{
				property: 'ProvinceDesc',
				type: EdmType.String
			},{
				property: 'AgreeId',
				type: EdmType.String
			},{
				property: 'BpCodeInAgree',
				type: EdmType.String
			},{
				property: 'Rate',
				type: EdmType.Number
			},{
				property: 'RateUnit',
				type: EdmType.String
			},{
				property: 'Cap',
				type: EdmType.Number
			},{
				property: 'ValidFrom',
				type: EdmType.Date
			},{
				property: 'ValidTo',
				type: EdmType.Date
			}];
		},
		onCalExport: function() {
			var aCols = this.createColumnConfig(),
			oSettings = {
				workbook: {
					columns: aCols,
					// hierarchyLevel: 'Level'
				},
				
				dataSource: this.getView().getModel('check').oData,
				// dataSource: this.oDetailModel.getProperty('/ToPrice/results'),
				fileName: 'Calculate.xlsx',
				worker: true // We need to disable worker because we are using a MockServer as OData Service
			},
			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
		},

	});
});
