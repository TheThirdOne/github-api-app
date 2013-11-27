function ghapi(user,repo,pass){
  this.user = user;
  this.password = pass;
  $.ajaxSetup({
  beforeSend: function (xhr){ 
        xhr.setRequestHeader('Authorization', make_base_auth(user, pass)); 
    }
});
  this.repo = repo;
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
ghapi.prototype.makeTree = function(base,tree){
  
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
  tree_base = commit.tree.sha;
  /*console.log(a.putData("/git/commits",JSON.stringify({"message": "my commit message",
  "author": {
    "name": "Scott Chacon",
    "email": "schacon@gmail.com",
    "date": "2008-07-09T16:13:30+12:00"
  },
  "parents":[parents],"tree":tree_base})));
  console.log(a.putData("/git/refs/heads/master",JSON.stringify({
  "sha": "2ce41964c465ac08045b135f68d9fe39317ebcf0"
})));*/
}