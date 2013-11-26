function ghapi(user,repo){
  this.user = user;
  this.repo = repo;
}
ghapi.prototype.getData = function(url){
  return $.ajax({
    type: "GET",
    url: 'https://api.github.com/repos/'+this.user+'/'+this.repo+url,
    crossDomain: true,
    async:false,
    failure: function(){console.log('error');},
    dataType: 'json'
  }).responseJSON;
};
ghapi.prototype.getCommitSha = function(ref){
  return this.getData('/git/refs/heads/'+ ref).object.sha;
};
a = new ghapi('thethirdone','github-api-testing');
//console.log('hello',a.getData('/git/refs/heads/master',function(data){console.log(data)}));
console.log(a.getCommitSha('master'));