var i18n = {
    options:{},
    props:{},
    init:function(options){
        var _self = this;
        var storageOptions = this.getOptions();
        this.options = options || storageOptions || {};
        this.options.path = this.options.path?this.options.path:"../i18n/localization";
        this.options.extname = this.options.extname?this.options.extname:".json";
        this.options.language = this.options.language?this.options.language:"zh_CN";
        var dirFiles = ipcRenderer.sendSync("sync-read-dir",this.options.path);
        this.options.localizations = dirFiles.filter(function(ele,pos){
            var splits = ele.split(_self.options.extname);
            return splits.length>1 && splits[splits.length-1] == "";
        });
        for(var i=0;i<this.options.localizations;i++){
            var jsonFile = this.options.localizations[i];
            var fileData = ipcRenderer.sendSync('sync-read-jsonfile',jsonFile);
            var key = ele.split(this.options.extname)[0];
            this.props[key] = fileData;
        }
        this.setOptions(this.options);
    },
    prop:function(key){
        var splitKeys = key.split(".");
        var props = this.props[this.language] || {};
        // deep copy
        var splitProps = JSON.parse(JSON.stringify(props));
        // get key of value
        for(var i=0;i<splitKeys.length;i++){
            var splitKey = splitKeys[i];
            var splitProps = splitProps[splitKey];
        }
        return splitProps;
    },
    getOptions:function(){
        var json = window.localStorage.getItem("i18n");
        var optoins = json==null ?{}:JSON.parse(json);
        return optoins;
    },
    setOptions:function(optoins){
        window.localStorage.setItem("i18n",JSON.stringify(optoins));
    }
}