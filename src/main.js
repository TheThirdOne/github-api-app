function ghapi(user,repo,pass){
  this.user = user;
  this.password = pass;
  $.ajaxSetup({
  beforeSend: function (xhr){ 
        xhr.setRequestHeader('Authorization', make_base_auth(user, pass)); 
    }
});
  this.repo = repo;
  this.blobs = [];
}
function make_base_auth(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return "Basic " + hash;
}
ghapi.prototype.getData = function(url){
  return this.send(url,{},"GET");
};
ghapi.prototype.putData = function(url,data){
  return this.send(url,data,"POST");
};
ghapi.prototype.send = function(url,data,type){
  return $.ajax({
    type: type,
    url: 'https://api.github.com/repos/'+this.user+'/'+this.repo+url,
    crossDomain: true,
    data:data,
    username: this.user,
    password: this.password,
    async:false,
    failure: function(){console.log('error');},
    dataType: 'json'
  }).responseJSON;
};
ghapi.prototype.getCommitSha = function(ref){
  return this.getData('/git/refs/heads/'+ ref).object.sha;
};
ghapi.prototype.getCommit = function(sha){
  return  this.getData('/git/commits/'+sha);
};
ghapi.prototype.addBlob = function(content){
  this.blobs.push(this.putData('/git/blobs',JSON.stringify({"content":content,"encoding":"utf-8"})).sha);
};
ghapi.prototype.makeTree = function(base,paths){
  var tree = [];
  for(var i = 0; i < this.blobs.length; i++){
    tree.push({"path":paths[i],"mode":"100644","type":"blob","sha":this.blobs[i]});
  }
  return {"base_tree":base,"tree":tree};
};
ghapi.prototype.getLeft = function(){
  console.log($.ajax({
    type: "GET",
    url: 'https://api.github.com/zen',
    crossDomain: true,
    async:false,
    failure: function(){console.log('error');},
    dataType: 'json'
  }).getAllResponseHeaders());
};
ghapi.prototype.getUser = function(){
  return $.ajax({
    type: "GET",
    url: 'https://api.github.com/users/'+this.user,
    crossDomain: true,
    async:false,
    failure: function(){console.log('error');},
    dataType: 'json'
  }).responseJSON;
};
ghapi.prototype.makeCommit= function(message,parents,tree,branch){
  var author = {"name":this.name,"email":this.getUser().email,"date":(new Date()).toISOString()};
  var result = this.putData('/git/trees',JSON.stringify(tree));
  var tosend = {"author":author,"message":message,"parents":parents,"tree":result.sha};
  result = this.putData("/git/commits",JSON.stringify(tosend));
  console.log(result);
  this.send("/git/refs/heads/"+branch,JSON.stringify({"sha":result.sha}),"PATCH");
};
ghapi.prototype.getFiles = function(sha){
  console.log(sha);
  var commit = this.getCommit(sha);
  return this.treeToObject(commit.tree.sha);
};
ghapi.prototype.treeToObject = function(tree_sha){
  var out = {};
  var tree = this.getData('/git/trees/'+tree_sha).tree;
  for(var i = 0;i < tree.length; i++){
    if(tree[i].type === "tree")
      out[tree[i].path] = this.treeToObject(tree[i].sha);
    else
      out[tree[i].path] = atob(unescape(this.getData('/git/blobs/'+tree[i].sha).content).replace(/\n/g,''));
  }
  return out;
};
ghapi.prototype.displayBlobs = function(blobs,div){
  var main = "";
  var top = "<ul>";
  var dir = "";
  var i = 1;
  for(var key in blobs){
    top += "<li><a href=\"#" + div + '-' + i + "\">"+key+"</a></li>";
    if(typeof blobs[key] === 'string')
      main += "<div contenteditable data-key=\""+key+"\" id=\"" + div + '-' + i +"\">"+blobs[key].replace(/\n/g,'<br>')+"</div>";
    i++;
  }
  
  $("#"+div).html(top + "</ul>" + main);
};
ghapi.prototype.commitChanges = function(div){

};
ghapi.prototype.isDiff = function(blobs, div){
  function diff(div,number){
    return $('#'+div+'-'+number).html().replace(/<br>/g,'\n') !== b[$('#'+div+'-'+number).attr('data-key')];
  }
  for(var i = 1; i < $('#tabs').children().length; i++){
  
  }
};
var a;
function authenticate(){
  a = new ghapi($('input#user').val(),$('input#repo').val(),$('input#pass').val());
  localStorage.setItem('user',$('input#user').val());
  localStorage.setItem('repo',$('input#repo').val());
  localStorage.setItem('pass',$('input#pass').val());
  console.log([a.getCommit(a.getCommitSha('master')).sha]);
}
$('input#user').val(localStorage.getItem('user'));
$('input#repo').val(localStorage.getItem('repo'));
$('input#pass').val(localStorage.getItem('pass'));

function go(){
  commit = a.getCommit(a.getCommitSha('master'));
  parents = commit.sha;
  
  b = a.getFiles(commit.sha);
  tree_base = commit.tree.sha;
  //a.makeCommit("YAY",[parents],a.makeTree(tree_base,['hello.txt','yolo.txt']),"master");
}