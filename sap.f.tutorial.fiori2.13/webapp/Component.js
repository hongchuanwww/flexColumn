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

			oCreateModel = new JSONModel({
				Changeflag: "C",
				Qty: "1",
				ToGroup: [],
				ToPrice: [],
				ToMessage: []
			});
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

			var sServiceUrl = "https://dev.abbott-md.cn:4443/sap/opu/odata/SAP/ZYCHCN_API_ORDER_002_SRV/",
				bJSON = true,
				sUser = "huangs03",
				sPwd = "P@ssword10";
			oODataModel = new sap.ui.model.odata.ODataModel(sServiceUrl, bJSON, sUser, sPwd);
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
					defaultThreeColumnLayoutType: fioriLibrary.LayoutType.EndColumnFullScreen,
					defaultEndColumnLayoutType: fioriLibrary.LayoutType.EndColumnFullScreen,
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
		},

		deepCopy: function(obj) {
			var newobj = null;     // 接受拷贝的新对象
			if(typeof(obj) === 'object' && obj !== null) {   // 判断是否是引用类型
				if(obj instanceof Date) {
					return new Date(obj.valueOf());
				}
				newobj = obj instanceof Array? []: {};          // 判断是数组还是对象
				for(var i in obj) {   
					newobj[i] = this._deepCopy(obj[i]);                      // 判断下一级是否还是引用类型
				} 
			} else {
				newobj = obj;
			}
			return newobj;
		},

		DatePipe: function(obj, prop) {
			// dateTime = new Date(dateTime.setHours(h, m, 0, 0));
			if(obj[prop]) {
				obj[prop] = new Date(obj[prop]);
				// var offSet = obj[prop].getTimezoneOffset();
				var offSetVal = obj[prop].getTimezoneOffset() / 60;
				var h = Math.floor(Math.abs(offSetVal));
				// var m = Math.floor((Math.abs(offSetVal) * 60) % 60);
				obj[prop] = new Date(obj[prop].setHours(h, 0, 0, 0));
			}
		},
	});
});
