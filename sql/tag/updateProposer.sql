do $$
declare
    pre_proposer int;
begin
    select count(*) into pre_proposer from tag where (proposer->${proposerType})::jsonb @> ${newProposer};

    if (pre_proposer = 0) then
            UPDATE tag
            SET proposer = jsonb_set(proposer,'{${proposerType^}}', proposer->${proposerType}|| ${newProposer}, true)
            where tid = ${tid};

    else
        return;
    end if;
end $$;
