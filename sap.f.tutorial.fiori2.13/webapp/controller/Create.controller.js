sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
], function (JSONModel, Controller, MessageToast, MessageBox, Fragment, BusyIndicator, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.Create", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oProductModel = this.oOwnerComponent.getModel('product');
			this.oColModel = this.oOwnerComponent.getModel('columns');
			this._DatePipe = this.oOwnerComponent.DatePipe;
			this._deepCopy = this.oOwnerComponent.deepCopy;
			this.oCreateModel =  this.oOwnerComponent.getModel('new');
			// this._initCreateModel();
			var settingModel = new JSONModel({
				minDate: new Date(),
			});
			this.getView().setModel(new JSONModel(), 'newProduct');
			this.getView().setModel(settingModel, 'setting');

            this.DIC = [
                'Product',
                'ProducDesc',
                'ValidFrom',
                'ValidTo'
                // 'TODO'
            ];
		},

		_initCreateModel: function() {
			var oData = this.oCreateModel.getData();
			[
				'ToGroup',
				'ToPrice',
				'ToMessage'
			].forEach(prop => {
				oData[prop] = [];
			});
			oData.Qty = "1";
			[
				'SortCode',
				'BdDesc',
				'BdPromType',
				'ValidFrom',
				'ValidTo',
				'Delivery',
				'Eqip'
			].forEach(prop => {
				oData[prop] = null;
			});
			this.oCreateModel.setData(oData);
		},

		onGroupPress: function (oEvent) {
			var group = oEvent.getSource().getBindingContextPath().split('/').pop();
			this._group = group;
			
			var oView = this.getView();
			oView.getModel('newProduct').setData(oView.getModel('new').getProperty("/ToGroup/" + group));
			
			// create dialog lazily
			if (!this.byId("createDetailDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "zychcn.zbundle01.view.CreateDetailDialog",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("createDetailDialog").open();
			}
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("create", {layout: sNextLayout});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("create", {layout: sNextLayout});
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this._initCreateModel();
			this.oRouter.navTo("master", {layout: sNextLayout});
		},

		addGroup: function () {
			var groups = this.oCreateModel.getProperty('/ToGroup');
			var GrpCode = 'GRP' + (groups.length + 1).toString().padStart(2,'0');
			groups.push({GrpCode, ToItem:[]});
			this.oCreateModel.setProperty('/ToGroup',groups);
		},
		deleteGroup : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				groups = this.oCreateModel.getProperty('/ToGroup');
			groups.splice(index,1);

			this.oCreateModel.setProperty('/ToGroup',groups);
		},
		addPrice: function () {
			var groups = this.oCreateModel.getProperty('/ToPrice');
			groups.push({});
			this.oCreateModel.setProperty('/ToPrice',groups);
		},
		deletePrice: function (e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				prices = this.oCreateModel.getProperty('/ToPrice');
			prices.splice(index,1);
			this.oCreateModel.setProperty('/ToPrice',prices);
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
		onSave:  function (data) {
			var oDataModel = this.getView().getModel('invoice');
			var fnSuccess = function (e) {
				MessageToast.show('success');
				this.handleClose();
				oDataModel.refresh();
				this._initCreateModel();
				this._naviToDetail(e.HeadId);
			}.bind(this);

			var fnError = function (oError) {
				// MessageBox.error(oError.message);
				MessageBox.error(JSON.parse(oError.response.body).error.message.value);
			}.bind(this);
			var sPath = 'BundleHeadSet';
			var data = this._deepCopy(this.oCreateModel.getData());

			var mParameters = {
				error: fnError,
				success: fnSuccess
			};
			// DatePicker数据转换
			this._DatePipe(data,'ValidFrom');
			this._DatePipe(data,'ValidTo');

			data.Qty = data.Qty.toString();
			[data.BuId, data.BuDesc] = data.BuId?.split(' ') || [];
			[data.BdPromType, data.BdPromTypeDesc] = data.BdPromType?.split(' ') || [];
			data.ToPrice.forEach(price => {
				this._DatePipe(price,'ValidFrom');
				this._DatePipe(price,'ValidTo');
				price.Changeflag = "C";
			});
			data.ToGroup.forEach(group => {
				group.Changeflag = "C";
				[group.GrpScope, group.GrpScopeDesc] = group.GrpScope?.split(' ') || [];
				group.GrpQty = group.GrpQty === undefined ? '' : group.GrpQty.toString();
				group.ToItem.forEach(item => {
					this._DatePipe(item,'ValidFrom');
					this._DatePipe(item,'ValidTo');
					item.Changeflag = "C";
					delete item.ProductDescZh;
				});
			});
			oDataModel.create(sPath, data, mParameters);
		},

		/// Product maintain page
		onValueHelpRequested: function(oEvent) {
			var group = this.oCreateModel.getProperty( "/ToGroup/" + this._group);
			this.GrpScope = group?.GrpScope?.split(' ')[0];
			var data = this.oCreateModel.getData();
			this.BuId = data.BuId?.split(' ')[0];
			if(!this.GrpScope || !this.BuId) {
				MessageBox.error('Please select BU ID and Group Scope');
				return;
			}
			this._oInput = oEvent.getSource();
			this._getProductList();
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

				// this._oValueHelpDialog.setTokens(this._oInput.getTokens());
				this._oValueHelpDialog.open();
			}.bind(this));
		},

		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			// this._oInput.setTokens(aTokens);
			if (aTokens.length == 0) {
				this._oInput.setSelectedKey(aTokens[i].getKey());
			} else {
				// var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
				var data = this.getView().getModel('newProduct').getProperty("/ToItem/")
				data.splice(data.length - 1, 1);
				for (var i = 0; i < aTokens.length; i++) {
					data.push({
						"Product": aTokens[i].getKey(),
						"ProductDescZh": aTokens[i].getText()
					});
				}
				this.getView().getModel('newProduct').setProperty("/ToItem/", data)
				// this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results', data);
			}
			
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

        fireProductPaste: function(oEvent) {
			var oTable = this.getView().byId("createItemTable");
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

        onProductPaste: function (e) {
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
			this.getView().getModel('newProduct').setProperty("/ToItem/", data);
			// this.getView().getModel('new').setProperty("/ToGroup/" + this.group + '/ToItem', data);
		},

		addRow: function (e) {
			var productData = this.getView().getModel('newProduct').getProperty("/ToItem/");
			productData.push({});
			this.getView().getModel('newProduct').setProperty("/ToItem/", productData);
		},

		deleteRow : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				data = this.getView().getModel('newProduct').getProperty("/ToItem/");
			data.splice(index,1);

			this.getView().getModel('newProduct').setProperty("/ToItem/", data);
		},

		onCloseDetailDialog: function () {
			this.byId("createDetailDialog").close();
		},

		onFilterBarSearch: function (oEvent) {
			var aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},

		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},
	});
});
