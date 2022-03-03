sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/Token',
	'sap/ui/core/Fragment'
], function (Controller,Token,Fragment) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.DetailDetail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oColModel = this.oOwnerComponent.getModel('columns');
			this.oProductModel = this.oOwnerComponent.getModel('product');
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
				this._getProductList();
			}
		},

		_getProductList: function() {
			var group = this.getView().getModel('detail').getProperty( "/ToGroup/results/" + this._item);
			var GrpScope = group?.GrpScope?.split(' ')[0];
			var data = this.getView().getModel('detail').getData();
			var BuId = data.BuId?.split(' ')[0];
			if(GrpScope && BuId) {
				var that = this;
				this.getView().getModel('invoice').read('/SHScopeSet?$filter=GrpScope%20eq%20%27'+GrpScope+'%27%20and%20BuId%20eq%20%27'+BuId+'%27', {
					success: function (oData) {
						that.oProductModel.setData(oData.results);
					}
				});
			} else {
				this.oProductModel.setData([]);
			}
		},

		firePaste: function(oEvent) {
			var oTable = this.getView().byId("itemTable");
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
			var data = this.getView().getModel('detail').getProperty("/ToGroup/results/" + this._item + '/ToItem/results');
            var newData = pasteData.map(row => {
				var obj = {};
				for(var i = 0; i < row.length; i++) {
					obj[this.DIC[i]] = row[i];
				}
				return obj;
			});
			data.push(newData);
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

		onValueHelpRequested: function(oEvent) {
			var aCols = this.oColModel.getData().cols;
			this._oInput = oEvent.getSource();
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

				var oToken = new Token();
				oToken.setKey(this._oInput.getSelectedKey());
				oToken.setText(this._oInput.getValue());
				this._oValueHelpDialog.setTokens([oToken]);
				this._oValueHelpDialog.open();
			}.bind(this));
		},

		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");

			if (aTokens.length > 0) {
				this._oInput.setSelectedKey(aTokens[0].getKey());
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
