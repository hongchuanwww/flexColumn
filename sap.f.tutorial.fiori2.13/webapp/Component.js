sap.ui.define([
	'sap/ui/core/UIComponent',
	'sap/ui/model/json/JSONModel',
	'sap/f/FlexibleColumnLayoutSemanticHelper',
	'sap/f/library'
], function(UIComponent, JSONModel, FlexibleColumnLayoutSemanticHelper, fioriLibrary) {
	'use strict';

	return UIComponent.extend('zychcn.zbundle01.Component', {

		metadata: {
			manifest: 'json'
		},

		init: function () {
			var oModel,
				oProductsModel,
				oODataModel,
				oCreateModel,
				oDetailModel,
				oColModel,
				oStateModel,
				oRouter;

			UIComponent.prototype.init.apply(this, arguments);

			oModel = new JSONModel();
			this.setModel(oModel);

			oCreateModel = new JSONModel();
			this.setModel(oCreateModel, 'new');

			oDetailModel = new JSONModel();
			this.setModel(oDetailModel, 'detail');

			oColModel = new JSONModel({
				"cols": [
					{
						"label": "Product",
						"template": "Product",
						"width": "5rem"
					},
					{
						"label": "ProductDescZh",
						"template": "ProductDescZh"
					},
					{
						"label": "ProductDescEn",
						"template": "ProductDescEn"
					}
				]
			});
			this.setModel(oColModel,'columns');

			oProductsModel = new JSONModel([]);
			this.setModel(oProductsModel,'product');

			oStateModel = new JSONModel([]);
			this.setModel(oStateModel,'state');
			
			var sServiceUrl = "/sap/opu/odata/SAP/ZYCHCN_API_ORDER_002_SRV/",
				bJSON = true;
			
			oODataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, bJSON);

			// var sServiceUrl = "https://dev.abbott-md.cn:4443/sap/opu/odata/SAP/ZYCHCN_API_ORDER_002_SRV/",
			// 	bJSON = true,
			// 	sUser = "huangs03",
			// 	sPwd = "Qwe@0501";
			// oODataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, bJSON, sUser, sPwd);
			this.setModel(oODataModel,'invoice');
			['PROM_TYPE','PROD_SCOPE'].forEach(key => this._getOptions(key));
			oRouter = this.getRouter();
			oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
			oRouter.initialize();
		},

		_getOptions: function(key) {
			var that = this;
			this.getModel('invoice').read('/SHConfigSet?$filter=SubName%20eq%20%27'+key+'%27', {
				success: function (oData) {
					var oModel = new JSONModel();
					oModel.setData(oData.results);
					that.setModel(oModel,key);
				}
			});
		},

		getHelper: function () {
			return this._getFcl().then(function(oFCL) {
				var oSettings = {
					defaultTwoColumnLayoutType: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
					initialColumnsCount: 1,
					maxColumnsCount: 3
				};
				return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings));
			 });
		},

		_onBeforeRouteMatched: function(oEvent) {
			var oModel = this.getModel(),
				sLayout = oEvent.getParameters().arguments.layout,
				oNextUIState;

			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				this.getHelper().then(function(oHelper) {
					oNextUIState = oHelper.getNextUIState(0);
					oModel.setProperty("/layout", oNextUIState.layout);
				});
				return;
			}

			oModel.setProperty("/layout", sLayout);
		},

		_getFcl: function () {
			return new Promise(function(resolve, reject) {
				var oFCL = this.getRootControl().byId('flexibleColumnLayout');
				if (!oFCL) {
					this.getRootControl().attachAfterInit(function(oEvent) {
						resolve(oEvent.getSource().byId('flexibleColumnLayout'));
					}, this);
					return;
				}
				resolve(oFCL);

			}.bind(this));
		}
	});
});
