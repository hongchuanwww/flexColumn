sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/Token',
	'sap/ui/core/Fragment',
	"sap/m/MessageBox",
	'sap/ui/core/BusyIndicator'
], function (Controller,Token,Fragment,MessageBox,BusyIndicator) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.DetailDetail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oColModel = this.oOwnerComponent.getModel('columns');
			this.oProductModel = this.oOwnerComponent.getModel('product');
			this._DatePipe = this.oOwnerComponent.DatePipe;
			this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onPatternMatch, this);
			this.DIC = [
                'Product',
                'ProducDesc',
                'ValidFrom',
                'ValidTo'
                // 'TODO'
            ];
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
			var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
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
			this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results',data);
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
				MessageBox.error('请先选择BU ID和Group Scope');
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
				var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
				data.splice(data.length - 1, 1);
				for (var i = 0; i < aTokens.length; i++) {
					data.push({
						"Product": aTokens[i].getKey()
					});
				}
				this.getView().getModel('detail').setProperty("/ToGroup/results/" + this._item + '/ToItem/results', data);
			}
			
			this._oValueHelpDialog.close();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		}
	});
});
