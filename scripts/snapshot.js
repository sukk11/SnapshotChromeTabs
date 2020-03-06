$(function() {
  const SNAPSHOT_KEYS={};
  SNAPSHOT_KEYS.keyName="_sskeys";
  SNAPSHOT_KEYS.keyPrefix="id-";
  let snapshotList=[];
  loadSnapshotList();

  $(document).on("click", "a[name=openTabs]", function(evt) {
    evt.preventDefault();
    var id=$(this).attr("id");
    var sst=_.find(snapshotList, function(item) {return item.sstId==id});
    if (!_.isUndefined(sst) && _.isArray(sst.tabUrls)) {
      $.each(sst.tabUrls, function(index, url) {
        chrome.tabs.create({url: url});
      });
    }
  });

  $(document).on("click", "a[name=deleteSnapshot]", function(evt) {
    evt.preventDefault();
    var id=$(this).attr("id");
    if (confirm("confirm to delete the snapshot?")) {
      chrome.storage.local.remove(id, function() {
        //reload snapshot list
        loadSnapshotList();
      });
    }
  });

  $("#btnClearSnapshot").click(function() {
    if (confirm("confirm to clear all snapshots?")) {
      chrome.storage.local.clear(function() {
        $("#snapshotTabs").empty();
      });
    }
  });

  $("#btnReload").click(function() {
    loadSnapshotList();
  });

  $("#btnSaveSnapshot") .click(function() {
    var me=this;
    $("#buttonBar :button").prop("disabled", true);
    var today=new Date();
    var year=today.getFullYear();
    var month=today.getMonth()+1;
    var date=today.getDate();
    chrome.tabs.getAllInWindow(function(allTabs) {
      try {
        if (allTabs.length>0) {
          var snapJsonData={};
          snapJsonData.snapshotName="snaptab - "+year+"-"+
            (month<10 ? "0"+month : month)+"-"+(date<10 ? "0"+date : date)+" "+
            (today.getHours()<10 ? "0"+today.getHours() : today.getHours())+":"+
            (today.getMinutes()<10 ? "0"+today.getMinutes() : today.getMinutes())+":"+
            (today.getSeconds()<10 ? "0"+today.getSeconds() : today.getSeconds());
          snapJsonData.tabUrls=[];
          $.each(allTabs, function(index, tabItem) {
            var url=tabItem.url;
            if ($.trim(url)!="") {
              snapJsonData.tabUrls.push(tabItem.url);
            }
          });

          var ssname=prompt("Please input snapshot name", snapJsonData.snapshotName);
          if (null==ssname) {
            $("#buttonBar :button").prop("disabled", false);
            return;
          } else if ($.trim(ssname)=="") {
            alert("snapshot name required!");
            $("#buttonBar :button").prop("disabled", false);
            return;
          } else {
            snapJsonData.snapshotName=$.trim(ssname);
          }

          let ukey=SNAPSHOT_KEYS.keyPrefix+today.getTime();
          snapJsonData.sstId=ukey;

          // retrieve storage key list
          chrome.storage.local.get(SNAPSHOT_KEYS.keyName, function(keys) {
            let sskeys=[];
            if (_.isArray(keys[SNAPSHOT_KEYS.keyName])) {
              sskeys=keys[SNAPSHOT_KEYS.keyName];
            }
            sskeys.push(ukey);

            // save unique key to storage key list.
            var paramObj={};
            paramObj[SNAPSHOT_KEYS.keyName]=sskeys;
            var paramObj2={};
            paramObj2[ukey]=snapJsonData;
            chrome.storage.local.set(paramObj, function() {
              // save snapshot data to storage.
              chrome.storage.local.set(paramObj2, function() {
                $("#buttonBar :button").prop("disabled", false);
                //reload snapshot list
                loadSnapshotList();
              });
            });
          });
        }
      } catch(e) {
        alert("create snapshot error! "+e);
        $("#buttonBar :button").prop("disabled", false);
      }
    });
  });

  /**
   * retrieve snapshot list, and render html data.
   */
  function loadSnapshotList() {
    chrome.storage.local.get(SNAPSHOT_KEYS.keyName, function(obj) {
      var sskeys=obj[SNAPSHOT_KEYS.keyName];
      if (_.isArray(sskeys)) {
        let htmlout="";
        // get snapshots by keys.
        chrome.storage.local.get(sskeys, function(result) {
          for (let prop in result) {
            if (!prop.startsWith(SNAPSHOT_KEYS.keyPrefix)) {
              continue;
            }
            let snapshot=result[prop];
            snapshotList.push(snapshot);
            var html="<li>";
            html+="<a href='javascript:void(0);' name='openTabs' id='"+snapshot.sstId+"'>"+snapshot.snapshotName+"</a> ";
            html+="<a href='javascript:void(0);' name='deleteSnapshot' id='"+snapshot.sstId+"'>[Delete]</a>";
            html+="</li>";
            htmlout+=html;
          }
          $("#snapshotTabs").html(htmlout);
        });
      }
    });
  }
});

