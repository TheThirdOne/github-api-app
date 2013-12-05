var debug = {
  'all':false,
  'do':{},
  'not':{},
  };
var binary = {
  'png':true,
  'jpg':true
};
function ghapi(user,repo,pass){
  if(debug.do.ghapi | debug.all && !debug.not.ghapi)console.log('ghapi:',user,repo);
  this.user = user;
  this.password = pass;
  var auth = make_base_auth(user, pass);
  $.ajaxSetup({
  beforeSend: function (xhr){ 
        xhr.setRequestHeader('Authorization',"Basic " + auth); 
    }
});
  if(repo.indexOf('/')===-1){
    repo = user +'/'+ repo;
  }
  if(repo.indexOf('@')===-1){
    this.branch = 'master';
    this.repo = repo;
  }else{
    var temp = repo.split('@');
    this.repo = temp[0];
    this.branch = temp[1];
  }
  this.blobs = [];
  this.paths = [];
}
function make_base_auth(user, password) {
  if(debug.do.make_base_auth | debug.all && !debug.not.make_base_auth)console.log('make_base_auth:',user);
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return hash;
}
ghapi.prototype.getData = function(url){
  if(debug.do.getData | debug.all && !debug.not.getData)console.log('getData:',url);
  return this.send(url,{},"GET");
};
ghapi.prototype.putData = function(url,data){
  if(debug.do.putData | debug.all && !debug.not.putData)console.log('putData:',url,data);
  return this.send(url,data,"POST");
};
ghapi.prototype.send = function(url,data,type){
  if(debug.do.send | debug.all && !debug.not.send)console.log('sendData:',url,data,type);
  return $.ajax({
    type: type,
    url: 'https://api.github.com/repos/'+this.repo+url,
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
  if(debug.do.getCommitSha | debug.all && !debug.not.getCommitSha)console.log('getCommitSha:',ref);
  return this.getData('/git/refs/heads/'+ ref).object.sha;
};
ghapi.prototype.getCommit = function(sha){
  if(debug.do.getCommit | debug.all && !debug.not.getCommit)console.log('getCommit:',sha);
  return  this.getData('/git/commits/'+sha);
};
ghapi.prototype.addBlob = function(content){
  if(debug.do.addBlob | debug.all && !debug.not.addBlob)console.log('addBlob:',content);
  this.blobs.push(this.putData('/git/blobs',JSON.stringify({"content":content,"encoding":"utf-8"})).sha);
};
ghapi.prototype.makeTree = function(base,paths){
  if(debug.do.makeTree | debug.all && !debug.not.makeTree)console.log('makeTree:',base,paths);
  var tree = [];
  for(var i = 0; i < this.blobs.length; i++){
    tree.push({"path":paths[i],"mode":"100644","type":"blob","sha":this.blobs[i]});
  }
  return {"base_tree":base,"tree":tree};
};
ghapi.prototype.getLeft = function(){
  if(debug.do.getLeft | debug.all && !debug.not.getLeft)console.log('getLeft:');
  return $.ajax({
    type: "GET",
    url: 'https://api.github.com/zen',
    crossDomain: true,
    async:false,
    failure: function(){console.log('error');},
    dataType: 'json'
  }).getAllResponseHeaders();
};
ghapi.prototype.getUser = function(){
  if(debug.do.getUser | debug.all && !debug.not.getUser)console.log('getUser:');
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
  if(debug.do.makeCommit | debug.all && !debug.not.makeCommit)console.log('makeCommit:',message,parents,tree,branch);
  var author = {"name":this.name,"email":this.getUser().email,"date":(new Date()).toISOString()};
  var result = this.putData('/git/trees',JSON.stringify(tree));
  var tosend = {"author":author,"message":message,"parents":parents,"tree":result.sha};
  result = this.putData("/git/commits",JSON.stringify(tosend));
  console.log(result);
  this.send("/git/refs/heads/"+branch,JSON.stringify({"sha":result.sha}),"PATCH");
  this.blobs = [];
};
ghapi.prototype.getFiles = function(sha){
  sha = sha || localStorage.lastsha;
  if(debug.do.getFiles | debug.all && !debug.not.getFiles)console.log('getFiles:',sha);
  var commit = this.getCommit(sha);
  if(sha === localStorage.lastsha)return JSON.parse(localStorage.files);
  var tmp = this.treeToObject(commit.tree.sha);
  localStorage.setItem('lastsha',sha);
  localStorage.setItem('files',JSON.stringify(tmp));
  return JSON.parse(localStorage.files);
};
ghapi.prototype.treeToObject = function(tree_sha){
  if(debug.do.treeToObject | debug.all && !debug.not.treeToObject)console.log('treeToObject:',tree_sha);
  var out = {};
  var t;
  var tree = this.getData('/git/trees/'+tree_sha).tree;
  for(var i = 0;i < tree.length; i++){
    if(tree[i].type === "tree")
      out[tree[i].path] = this.treeToObject(tree[i].sha);
    else{
      t = tree[i].path.split('.')[1];
      if(!binary[t])
        out[tree[i].path] = atob(unescape(this.getData('/git/blobs/'+tree[i].sha).content).replace(/\n/g,''));
    }
  }
  return out;
};
ghapi.prototype.displayBlobs = function(blobs,div){
  if(debug.do.displayBlobs | debug.all && !debug.not.displayBlobs)console.log('displayBlobs:',blobs,div);
  var main = "";
  var top = "<ul>";
  var todo = [];
  var i = 1;
  for(var key in blobs){
    top += "<li><a href=\"#" + div + '-' + i + "\">"+key+((typeof blobs[key] === 'string')?'':'/')+"</a></li>";
    if(typeof blobs[key] === 'string')
      main += "<div contenteditable data-type=\"blob\" data-key=\""+key+"\" id=\"" + div + '-' + i +"\">"+this.escape(blobs[key])+"</div>";
    else{
      todo.push({'key':key,'i':i});
      main += "<div data-type=\"tree\" data-key=\""+key+"\" id=\"" + div + '-' + i +"\"></div>";
    }
    i++;
  }
  $("#"+div).html(top + "</ul>" + main);
  $('#'+div).tabs();
  for(var k in todo)
    this.displayBlobs(blobs[todo[k].key],div + '-' +  todo[k].i);
};
ghapi.prototype.commitChanges = function(div,message,branch){
  if(debug.do.commitChanges | debug.all && !debug.not.commitChanges)console.log('commitChanges:',div,message,branch);
  this.makeBlobsFromArray(this.makeArrayFromDiff(div));
  this.commitCurrentBlobs(message,branch);
};
ghapi.prototype.commitCurrentBlobs=function(message,branch){
  commit = this.getCommit(this.getCommitSha(branch));
  parents = commit.sha;
  tree_base = commit.tree.sha;
  this.makeCommit(message,[parents],this.makeTree(tree_base,this.paths),branch);
};
ghapi.prototype.makeArrayFromDiff = function(div){
  if(debug.do.makeBlobsFromDiff | debug.all && !debug.not.makeBlobsFromDiff)console.log('makeBlobsFromDiff:',div);
  var values = [];
  var paths = [];
  for(var i = 1; i < $('#'+div).children().length; i++){
    if($('#'+div+'-'+i).attr('data-type')==='blob'){
      if(this.isDiff(div+'-'+i)){
        values.push(this.getValue(div+'-'+i));
        paths.push(this.getPath(div+'-'+i));
      }
    }else{
      var temp = this.makeArrayFromDiff(div+'-'+i);
      for(var k = 0; k < temp[0].length;k++){
        values.push(temp[1][k]);
        paths.push(temp[0][k]);
      }
    }
  }
  return [paths,values];
};
ghapi.prototype.makeBlobsFromArray = function(arrays){
  for(var k = 0; k < arrays[0].length; k++){
    this.addBlob(arrays[1][k]);
    this.paths.push(arrays[0][k]);
  }
};
ghapi.prototype.getPath = function(div){
  if(debug.do.getPath | debug.all && !debug.not.getPath)console.log('getPath:',div);
  div = '#'+div;
  var path = $(div).attr('data-key');
  div = $(div).parent();
  while($(div).attr('data-key')){
    path = $(div).attr('data-key') + '/' + path;
    div = $(div).parent();
  }
  return path;
};
ghapi.prototype.isDiff = function(div){
  if(debug.do.isDiff | debug.all && !debug.not.isDiff)console.log('isDiff:',div);
  var path = this.getPath(div);
  path = path.split('/');
  value = this.getFiles();
  for(var i = 0; i < path.length; i++)
    value = value[path[i]];
  return this.getValue(div) !== value;
};
ghapi.prototype.escape = function(str){
  if(debug.do.escape | debug.all && !debug.not.escape)console.log('escape:');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>').replace(/\ /g,'&nbsp;');
};
ghapi.prototype.unescape = function(str){
  if(debug.do.unescape | debug.all && !debug.not.unescape)console.log('unescape:',str);
  return str.replace(/<br>/g,'\n').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
};
ghapi.prototype.getValue = function(div){
  if(debug.do.getValue | debug.all && !debug.not.getValue)console.log('getValue:',div);
  return this.unescape($('#'+div).html());
};
var a;
function clone(){
  if(debug.do.clone | debug.all && !debug.not.clone)console.log('clone');
  a = new ghapi($('input#user').val(),$('input#repo').val(),$('input#pass').val());
  localStorage.setItem('user',$('input#user').val());
  localStorage.setItem('repo',$('input#repo').val());
  localStorage.setItem('pass',$('input#pass').val());
  $('#login').hide();
  $('#menu').show();
  $('#repodata').html('Repo: &nbsp&nbsp'+ a.repo + '@' + a.branch);
  go();
  $('#container').html('<div id=\"tabs\"></div>');
  a.displayBlobs(a.files,'tabs');
}
$('input#user').val(localStorage.getItem('user'));
$('input#repo').val(localStorage.getItem('repo'));
$('input#pass').val(localStorage.getItem('pass'));
function logout(){
  $('#login').show();
  $('#menu').hide();
  $('#container').html('No data in Repo');
}
function makeCommit(){
  var temp = a.makeArrayFromDiff('tabs');
  out ='Files For Commit:\n';
  for(var i = 0; i < temp[0].length;i++)
    out+=temp[0][i]+'\n';
  var message = prompt(out+'Commit Name');
  a.makeBlobsFromArray(temp);
  a.commitCurrentBlobs(message,a.branch)
}
function go(){
  if(debug.do.go | debug.all && !debug.not.go)console.log('go');
  var commit = a.getCommit(a.getCommitSha(a.branch));
  var parents = commit.sha;
  
  a.files = a.getFiles(commit.sha);
  var tree_base = commit.tree.sha;
  //a.makeCommit("YAY",[parents],a.makeTree(tree_base,['hello.txt','yolo.txt']),"master");
}