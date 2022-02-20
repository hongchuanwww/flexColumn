sap.ui.define([
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/m/Token',
	'sap/ui/core/Fragment'
], function (JSONModel, Controller, Token, Fragment) {
	"use strict";

	return Controller.extend("zychcn.zbundle01.controller.CreateDetail", {
		onInit: function () {
			this.oOwnerComponent = this.getOwnerComponent();

			this.oRouter = this.oOwnerComponent.getRouter();
			this.oModel = this.oOwnerComponent.getModel();
			this.oRouter.getRoute("createDetail").attachPatternMatched(this._onPatternMatch, this);
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

		_onPatternMatch: function (oEvent) {
			this.group = oEvent.getParameter("arguments").group;
			if(this.group) {
                this.getView().bindElement({
                    path: "/ToGroup/" + this.group,
					model: "new"
                });
			}
		},

		handleFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/fullScreen");
			this.oRouter.navTo("createDetail", {layout: sNextLayout});
		},

		handleExitFullScreen: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
			this.oRouter.navTo("createDetail", {layout: sNextLayout});
		},

		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
			this.oRouter.navTo("create", {layout: sNextLayout});
		},

		onExit: function () {
			this.oRouter.getRoute("createDetail").detachPatternMatched(this._onPatternMatch, this);
		},

        firePaste: function(oEvent) {
			var oTable = this.getView().byId("table");
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
			this.getView().getModel('new').setProperty("/ToGroup/" + this.group + '/ToItem', data);
		},

		addRow: function (e) {
			var data = this.getView().getModel('new').getProperty("/ToGroup/" + this.group + '/ToItem');
			data.push({});
			this.getView().getModel('new').setProperty("/ToGroup/" + this.group + '/ToItem', data);
		},

		deleteRow : function(e) {
			var btn = e.getSource(),
				row = btn.getParent(),
				table = row.getParent(),
				index = table.indexOfItem(row),
				data = this.getView().getModel('new').getProperty("/ToGroup/" + this.group + '/ToItem');
			data.splice(index,1);

			this.getView().getModel('new').setProperty("/ToGroup/" + this.group + '/ToItem', data);
		},

		onValueHelpRequested: function() {
			// var aCols = this.oColModel.getData().cols;

			Fragment.load({
				name: "zychcn.zbundle01.view.ValueHelpDialogSelect",
				controller: this
			}).then(function name(oFragment) {
				this._oValueHelpDialog = oFragment;
				this.getView().addDependent(this._oValueHelpDialog);

				this._oValueHelpDialog.getTableAsync().then(function (oTable) {
					// oTable.setModel(this.oProductsModel);
					// oTable.setModel(this.oColModel, "columns");

					// if (oTable.bindRows) {
					// 	oTable.bindAggregation("rows", "/ProductCollection");
					// }

					// if (oTable.bindItems) {
					// 	oTable.bindAggregation("items", "/ProductCollection", function () {
					// 		return new ColumnListItem({
					// 			cells: aCols.map(function (column) {
					// 				return new Label({ text: "{" + column.template + "}" });
					// 			})
					// 		});
					// 	});
					// }

					// this._oValueHelpDialog.update();
				}.bind(this));

				// var oToken = new Token();
				// oToken.setKey(this._oInput.getSelectedKey());
				// oToken.setText(this._oInput.getValue());
				// this._oValueHelpDialog.setTokens([oToken]);
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
