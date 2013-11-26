function ghapi(user,repo,pass){
  this.user = user;
  this.password = pass;
  this.repo = repo;
}
ghapi.prototype.getData = function(url){
  return $.ajax({
    type: "GET",
    url: 'https://api.github.com/repos/'+this.user+'/'+this.repo+url,
    crossDomain: true,
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
ghapi.prototype.makeParentArray = function(commit,addthis){
  console.log(commit)
  var out = [];
  for(var i=0;i < commit.parents.length;i++)
    out.push(commit.parents[i].sha);
  if(addthis)
    out.push(commit.sha);
  return out;
};
a = new ghapi('thethirdone','github-api-testing');
//console.log('hello',a.getData('/git/refs/heads/master',function(data){console.log(data)}));
console.log(a.makeParentArray(a.getCommit(a.getCommitSha('master')),true));