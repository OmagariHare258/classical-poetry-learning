-- 扩展古诗词数据库 - 添加更多经典诗词
-- 创建时间: 2025年7月21日

-- 插入更多经典古诗词
INSERT OR IGNORE INTO poems (title, author, dynasty, content, translation, difficulty, category) VALUES

-- 李白作品集
('早发白帝城', '李白', '唐', '朝辞白帝彩云间，千里江陵一日还。两岸猿声啼不住，轻舟已过万重山。', '清晨告别五彩云霞映照的白帝城，千里之遥的江陵一天就能到达。两岸猿猴啼声还在耳边不断，轻快的小船已驶过万重青山。', 'medium', '豪放,山水'),

('将进酒', '李白', '唐', '君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。', '你难道看不见那黄河之水从天上奔腾而来，波涛翻滚直奔东海，从不再往回流。你难道看不见那年迈的父母，对着明镜悲叹自己的白发，早晨还是满头的黑发，怎么才到傍晚就变成了雪白一片。', 'hard', '豪放,人生'),

-- 杜甫作品集
('春望', '杜甫', '唐', '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。烽火连三月，家书抵万金。白头搔更短，浑欲不胜簪。', '长安沦陷，国家破碎，只有山河依旧；春天来了，人烟稀少的长安城里草木茂密。感于战败的时局，看到花开而潸然泪下，内心惆怅怨恨，听到鸟鸣而心惊胆战。连绵的战火已经延续了半年多，家书难得，一封抵得上万两黄金。愁绪缠绕，搔头思考，白发越搔越短，简直插不上簪了。', 'hard', '忧国,战乱'),

('绝句', '杜甫', '唐', '两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。', '两只黄鹂在翠绿的柳树间婉转地歌唱，一队整齐的白鹭直冲向蔚蓝的天空。我坐在窗前，可以望见西岭上堆积着终年不化的积雪，门前停泊着自万里外的东吴远行而来的船只。', 'medium', '写景,色彩'),

-- 王维作品集
('九月九日忆山东兄弟', '王维', '唐', '独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。', '独自远离家乡无法与家人团聚，每到重阳佳节倍加思念远方的亲人。远远想到兄弟们身佩茱萸登上高处，也会因为少我一人而生遗憾之情。', 'medium', '思亲,节日'),

('鹿柴', '王维', '唐', '空山不见人，但闻人语响。返景入深林，复照青苔上。', '幽静的山谷里看不见人，只能听到那说话的声音。落日的影晕映入了深林，又照在青苔上景色宜人。', 'medium', '禅意,山水'),

-- 白居易作品集
('忆江南', '白居易', '唐', '江南好，风景旧曾谙。日出江花红胜火，春来江水绿如蓝。能不忆江南？', '江南的风景多么美好，如画的风景久已熟悉。春天到来时，太阳从江面升起，把江边的鲜花照得比火红，碧绿的江水绿得胜过蓝草。怎能叫人不怀念江南？', 'easy', '江南,怀念'),

-- 苏轼作品集
('题西林壁', '苏轼', '宋', '横看成岭侧成峰，远近高低各不同。不识庐山真面目，只缘身在此山中。', '从正面、侧面看庐山山岭连绵起伏、山峰耸立，从远处、近处、高处、低处看庐山，庐山呈现各种不同的样子。我之所以认不清庐山真正的面目，是因为我人身处在庐山之中。', 'hard', '哲理,山水'),

('水调歌头·明月几时有', '苏轼', '宋', '明月几时有？把酒问青天。不知天上宫阙，今夕是何年？', '明月从什么时候才开始出现的？我端起酒杯遥问苍天。不知道在天上的宫殿，今天晚上是何年何月。', 'hard', '中秋,哲理'),

-- 李清照作品集
('如梦令', '李清照', '宋', '常记溪亭日暮，沉醉不知归路。兴尽晚回舟，误入藕花深处。争渡，争渡，惊起一滩鸥鹭。', '经常记起溪边亭中游玩直到日暮时分，饮酒过度，陶醉其中，不知道回去的路。游玩尽兴后天色已晚才想起回家，却迷途误入了荷花深处。怎样才能划出去呢？怎样才能划出去呢？叽喳声惊叫声划船声惊起了一滩鸥鹭。', 'medium', '闺怨,游玩'),

-- 辛弃疾作品集
('西江月·夜行黄沙道中', '辛弃疾', '宋', '明月别枝惊鹊，清风半夜鸣蝉。稻花香里说丰年，听取蛙声一片。', '天边的明月升上了树梢，惊飞了栖息在枝头的喜鹊。清凉的晚风仿佛传来了远处的蝉叫声。在稻花的香气里，人们谈论着丰收的年景，耳边传来一阵阵青蛙的叫声，好像在说着丰收年。', 'medium', '田园,丰收'),

-- 陆游作品集
('游山西村', '陆游', '宋', '莫笑农家腊酒浑，丰年留客足鸡豚。山重水复疑无路，柳暗花明又一村。', '不要笑农家腊月里酿的酒浊而又浑，在丰收年景里待客菜肴非常丰盛。山峦重叠水流曲折正担心无路可走，柳绿花艳忽然眼前又出现一个山村。', 'medium', '田园,哲理'),

-- 王勃作品集
('送杜少府之任蜀州', '王勃', '唐', '城阙辅三秦，风烟望五津。与君离别意，同是宦游人。海内存知己，天涯若比邻。无为在歧路，儿女共沾巾。', '巍巍长安，雄踞三秦之地；渺渺四川，但见五津云烟。与你握手作别时，彼此间心心相印；你我都是远离故乡，出外做官之人。四海之内只要有了你，知己啊知己，纵然远隔天涯海角，都像是近邻一样的亲近。绝不要在岔路口上，像小儿女那样悲伤的眼泪把巾帕沾湿。', 'hard', '送别,友情'),

-- 贺知章作品集
('回乡偶书', '贺知章', '唐', '少小离家老大回，乡音无改鬓毛衰。儿童相见不相识，笑问客从何处来。', '我在年少时离开家乡，到了迟暮之年才回来。我的乡音虽未改变，但鬓角的毛发却已经疏落。儿童们看见我，没有一个认识的。他们笑着询问：这客人是从何处而来的呀？', 'easy', '思乡,人生'),

-- 孟郊作品集
('游子吟', '孟郊', '唐', '慈母手中线，游子身上衣。临行密密缝，意恐迟迟归。谁言寸草心，报得三春晖。', '慈母用手中的针线，为远行的儿子赶制身上的衣衫。临行前一针针密密地缝缀，怕的是儿子回来得晚衣服破损。有谁敢说，子女像小草那样微弱的孝心，能够报答得了像春晖普泽的慈母恩情呢？', 'easy', '母爱,亲情'),

-- 杨万里作品集
('小池', '杨万里', '宋', '泉眼无声惜细流，树阴照水爱晴柔。小荷才露尖尖角，早有蜻蜓立上头。', '泉眼悄然无声是因舍不得细细的水流，树阴倒映水面是喜爱晴天和风的轻柔。娇嫩的小荷叶刚从水面露出尖尖的角，早有一只调皮的小蜻蜓立在它的上头。', 'easy', '夏天,荷花'),

-- 范仲淹作品集  
('江上渔者', '范仲淹', '宋', '江上往来人，但爱鲈鱼美。君看一叶舟，出没风波里。', '江上来来往往的人只喜爱鲈鱼的味道鲜美。请您看那一叶小舟，时隐时现在滔滔风浪里。', 'medium', '渔民,社会'),

-- 王安石作品集
('元日', '王安石', '宋', '爆竹声中一岁除，春风送暖入屠苏。千门万户曈曈日，总把新桃换旧符。', '阵阵轰鸣的爆竹声中，旧的一年已经过去；和暖的春风吹来了新年，人们欢乐地畅饮着新酿的屠苏酒。初升的太阳照耀着千家万户，他们都忙着把旧的桃符取下，换上新的桃符。', 'easy', '新年,节日'),

('梅花', '王安石', '宋', '墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。', '那墙角的几枝梅花，冒着严寒独自盛开。远远的就知道洁白的梅花不是雪，因为有梅花的幽香传来。', 'easy', '梅花,品格'),

-- 柳永作品集
('雨霖铃', '柳永', '宋', '寒蝉凄切，对长亭晚，骤雨初歇。都门帐饮无绪，留恋处，兰舟催发。', '秋后的蝉叫得是那样地凄凉而急促，面对着长亭，正是傍晚时分，一阵急雨刚停住。在京都门外设帐饯别，却没有畅饮的心绪，正在依依不舍的时候，船上的人已催着出发。', 'hard', '离别,婉约');

-- 更新诗词数量统计
UPDATE ai_service_configs SET additional_params = json('{"total_poems": 28}') WHERE service_name = 'baidu';
