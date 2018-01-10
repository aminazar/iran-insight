UPDATE ${tableName~} SET tags = array_remove(tags,${tag}) WHERE ${condition^};
