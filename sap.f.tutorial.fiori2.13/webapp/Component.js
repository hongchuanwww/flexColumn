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
				oRouter;

			UIComponent.prototype.init.apply(this, arguments);

			oModel = new JSONModel();
			this.setModel(oModel);

			oCreateModel = new JSONModel();
			this.setModel(oCreateModel, 'new');

			oDetailModel = new JSONModel();
			this.setModel(oDetailModel, 'detail');

			// set products demo model on this sample
			oProductsModel = new JSONModel(sap.ui.require.toUrl('zychcn/zbundle01/localService/mockdata/products.json'));
			oProductsModel.setSizeLimit(1000);
			this.setModel(oProductsModel, 'products');
			
			var sServiceUrl = "/sap/opu/odata/SAP/ZYCHCN_API_ORDER_002_SRV/",
				bJSON = true;
			
			oODataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, bJSON);

			// var sServiceUrl = "https://dev.abbott-md.cn:4443/sap/opu/odata/SAP/ZYCHCN_API_ORDER_002_SRV/",
			// 	bJSON = true,
			// 	sUser = "huangs03",
			// 	sPwd = "3edc!QAZ";
			// oODataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, bJSON, sUser, sPwd);
			this.setModel(oODataModel,'invoice');

			oRouter = this.getRouter();
			oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
			oRouter.initialize();
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
